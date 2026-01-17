package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/websocket"
)

type LogHandler struct {
	repo     *LogRepository
	upgrader websocket.Upgrader
}

func NewLogHandler(repo *LogRepository) *LogHandler {
	return &LogHandler{
		repo: repo,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow all origins for demo
			},
		},
	}
}

func (h *LogHandler) GetLogs(w http.ResponseWriter, r *http.Request) {
	// Enable CORS for frontend
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		return
	}

	q := h.parseQuery(r)
	logs, err := h.repo.GetLogs(r.Context(), q)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func (h *LogHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		return
	}

	q := h.parseQuery(r)
	stats, err := h.repo.GetStats(r.Context(), q)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func (h *LogHandler) WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Failed to upgrade to WebSocket:", err)
		return
	}
	defer conn.Close()

	// Simple streaming loop: check for new logs every 2 seconds
	// In production, this should be event-driven (e.g. consuming Kafka)
	// or use efficient polling with cursor.
	
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	lastTimestamp := time.Now().Add(-5 * time.Second)

	for {
		select {
		case <-ticker.C:
			q := LogQuery{
				StartTime: lastTimestamp,
				EndTime:   time.Now(),
				Limit:     100,
			}
			
			logs, err := h.repo.GetLogs(r.Context(), q)
			if err != nil {
				log.Println("Error fetching logs for WS:", err)
				continue
			}

			if len(logs) > 0 {
				lastTimestamp = logs[0].Timestamp.Add(1 * time.Nanosecond) // Advance cursor
				
				// Send logs to client
				if err := conn.WriteJSON(logs); err != nil {
					log.Println("Error writing to WS:", err)
					return
				}
			}
		}
	}
}

func (h *LogHandler) parseQuery(r *http.Request) LogQuery {
	query := r.URL.Query()
	
	endTime := time.Now()
	startTime := endTime.Add(-1 * time.Hour)
	limit := 100

	if t := query.Get("start_time"); t != "" {
		if parsed, err := time.Parse(time.RFC3339, t); err == nil {
			startTime = parsed
		}
	}
	if t := query.Get("end_time"); t != "" {
		if parsed, err := time.Parse(time.RFC3339, t); err == nil {
			endTime = parsed
		}
	}
	if l := query.Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	return LogQuery{
		Service:   query.Get("service"),
		Level:     query.Get("level"),
		Search:    query.Get("search"),
		StartTime: startTime,
		EndTime:   endTime,
		Limit:     limit,
	}
}
