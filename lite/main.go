package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/websocket"
)

// LiteServer combines Collector and API into a single binary
// It skips Kafka/ClickHouse and uses Postgres for everything.
func main() {
	log.Println("Starting LogStream LITE (Unified Server)...")

	// Configuration
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	// Initialize Postgres Connection (Shared for Auth and Logs)
	pgProducer, err := NewPostgresProducer(dbUrl)
	if err != nil {
		log.Fatalf("Failed to connect to Postgres: %v", err)
	}
	defer pgProducer.Close()

	// Initialize Auth Validator
	validator, err := NewApiKeyValidator(dbUrl)
	if err != nil {
		log.Fatalf("Failed to connect to Postgres for Auth: %v", err)
	}
	defer validator.Close()

	// 1. COLLECTOR HANDLER
	// In Lite mode, we adapt the PostgresProducer to match the interface expected by LogHandler
	// We need to refactor LogHandler to accept an interface instead of *KafkaProducer
	// For now, let's create a quick adapter or modify Handler.
	
	// Since we are in a hurry, I will implement a specific LiteHandler here
	http.HandleFunc("/ingest", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		apiKey := r.Header.Get("Authorization")
		if apiKey == "" || !validator.Validate(apiKey) {
			http.Error(w, "Invalid API Key", http.StatusUnauthorized)
			return
		}

		var entry LogEntry
		if err := json.NewDecoder(r.Body).Decode(&entry); err != nil {
			http.Error(w, "Invalid body", http.StatusBadRequest)
			return
		}
		if entry.Timestamp.IsZero() {
			entry.Timestamp = time.Now().UTC()
		}

		// Write to Postgres SYNCHRONOUSLY to catch errors
		if err := pgProducer.WriteLog(entry); err != nil {
			log.Printf("Error writing log to DB: %v", err)
			http.Error(w, "Failed to write log to database", http.StatusInternalServerError)
			return
		}

		// Broadcast to WebSockets (Async is fine here)
		go broadcastLog(entry)

		w.WriteHeader(http.StatusAccepted)
		w.Write([]byte(`{"status":"accepted"}`))
	})

	// 2. API HANDLERS (Read from Postgres)
	http.HandleFunc("/logs", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")

		// Parse Query Params
		query := r.URL.Query()
		service := query.Get("service")
		level := query.Get("level")
		search := query.Get("search")
		startTime := query.Get("start_time")
		endTime := query.Get("end_time")

		// Build SQL Query
		sql := `SELECT timestamp, service, level, message, metadata FROM "Log" WHERE 1=1`
		var args []interface{}
		argId := 1

		if service != "" {
			sql += fmt.Sprintf(" AND service = $%d", argId)
			args = append(args, service)
			argId++
		}
		if level != "" {
			sql += fmt.Sprintf(" AND level = $%d", argId)
			args = append(args, level)
			argId++
		}
		if search != "" {
			sql += fmt.Sprintf(" AND message ILIKE $%d", argId)
			args = append(args, "%"+search+"%")
			argId++
		}
		if startTime != "" {
			sql += fmt.Sprintf(" AND timestamp >= $%d", argId)
			args = append(args, startTime)
			argId++
		}
		if endTime != "" {
			sql += fmt.Sprintf(" AND timestamp <= $%d", argId)
			args = append(args, endTime)
			argId++
		}

		sql += " ORDER BY timestamp DESC LIMIT 100"

		log.Printf("Executing Logs Query: %s params: %v", sql, args)

		// Execute Query
		rows, err := pgProducer.db.Query(sql, args...)
		if err != nil {
			log.Printf("Error querying logs: %v", err)
			http.Error(w, "Failed to fetch logs", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var logs []LogEntry
		for rows.Next() {
			var l LogEntry
			var metadataBytes []byte
			if err := rows.Scan(&l.Timestamp, &l.Service, &l.Level, &l.Message, &metadataBytes); err != nil {
				continue
			}
			if len(metadataBytes) > 0 {
				json.Unmarshal(metadataBytes, &l.Metadata)
			}
			logs = append(logs, l)
		}

		if logs == nil {
			logs = []LogEntry{}
		}

		json.NewEncoder(w).Encode(logs)
	})

	http.HandleFunc("/stats", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")

		// Parse Query Params
		query := r.URL.Query()
		startTime := query.Get("start_time")
		endTime := query.Get("end_time")

		// Aggregate logs by minute
		sql := `
			SELECT date_trunc('minute', timestamp) as minute, count(*) as count
			FROM "Log"
			WHERE 1=1
		`
		var args []interface{}
		argId := 1

		if startTime != "" {
			sql += fmt.Sprintf(" AND timestamp >= $%d", argId)
			args = append(args, startTime)
			argId++
		} else {
			// Default to 24 hours if no start time provided
			sql += " AND timestamp > NOW() - INTERVAL '24 hours'"
		}

		if endTime != "" {
			sql += fmt.Sprintf(" AND timestamp <= $%d", argId)
			args = append(args, endTime)
			argId++
		}

		sql += `
			GROUP BY minute
			ORDER BY minute ASC
		`
		
		log.Printf("Executing Stats Query: %s params: %v", sql, args)
		
		rows, err := pgProducer.db.Query(sql, args...)
		if err != nil {
			log.Printf("Error querying stats: %v", err)
			http.Error(w, "Failed to fetch stats", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		type Stat struct {
			Timestamp time.Time `json:"timestamp"`
			Count     int       `json:"count"`
		}
		var stats []Stat

		for rows.Next() {
			var s Stat
			if err := rows.Scan(&s.Timestamp, &s.Count); err != nil {
				continue
			}
			stats = append(stats, s)
		}

		if stats == nil {
			stats = []Stat{}
		}

		json.NewEncoder(w).Encode(stats)
	})

	http.HandleFunc("/ws", handleWebSocket)

	// Start Server
	log.Printf("Listening on :%s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

// Simple WebSocket Hub for Lite Mode
var clients = make(map[*websocket.Conn]bool)
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer ws.Close()
	clients[ws] = true
	
	for {
		_, _, err := ws.ReadMessage()
		if err != nil {
			delete(clients, ws)
			break
		}
	}
}

func broadcastLog(entry LogEntry) {
	msg, _ := json.Marshal([]LogEntry{entry})
	for client := range clients {
		client.WriteMessage(websocket.TextMessage, msg)
	}
}
