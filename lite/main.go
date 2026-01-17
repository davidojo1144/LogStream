package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

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

		// Write to Postgres
		go func() {
			if err := pgProducer.WriteLog(entry); err != nil {
				log.Printf("Error writing log: %v", err)
			}
			// Broadcast to WebSockets
			broadcastLog(entry)
		}()

		w.WriteHeader(http.StatusAccepted)
		w.Write([]byte(`{"status":"accepted"}`))
	})

	// 2. API HANDLERS (Read from Postgres)
	http.HandleFunc("/logs", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		// Implement simple query from Postgres
		// ... (omitted for brevity, assume simple SELECT)
		w.Write([]byte(`[]`)) // Placeholder
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
