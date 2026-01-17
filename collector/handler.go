package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

type LogHandler struct {
	producer *KafkaProducer
}

func NewLogHandler(producer *KafkaProducer) *LogHandler {
	return &LogHandler{
		producer: producer,
	}
}

func (h *LogHandler) HandleLog(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var entry LogEntry
	if err := json.NewDecoder(r.Body).Decode(&entry); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Set timestamp if missing
	if entry.Timestamp.IsZero() {
		entry.Timestamp = time.Now().UTC()
	}

	// Asynchronously push to Kafka to keep API latency low
	// In a production system, we might want to handle errors more robustly 
	// (e.g., local buffer if Kafka is down)
	go func(e LogEntry) {
		if err := h.producer.WriteLog(e); err != nil {
			log.Printf("Error writing to Kafka: %v", err)
		}
	}(entry)

	w.WriteHeader(http.StatusAccepted)
	w.Write([]byte(`{"status":"accepted"}`))
}
