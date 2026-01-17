package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

type LogHandler struct {
	producer  *KafkaProducer
	validator *ApiKeyValidator
}

func NewLogHandler(producer *KafkaProducer, validator *ApiKeyValidator) *LogHandler {
	return &LogHandler{
		producer:  producer,
		validator: validator,
	}
}

func (h *LogHandler) HandleLog(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Validate API Key
	apiKey := r.Header.Get("Authorization")
	if apiKey == "" {
		http.Error(w, "Missing Authorization header", http.StatusUnauthorized)
		return
	}

	if !h.validator.Validate(apiKey) {
		http.Error(w, "Invalid API Key", http.StatusUnauthorized)
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

	// Asynchronously push to Kafka
	go func(e LogEntry) {
		if err := h.producer.WriteLog(e); err != nil {
			log.Printf("Error writing to Kafka: %v", err)
		}
	}(entry)

	w.WriteHeader(http.StatusAccepted)
	w.Write([]byte(`{"status":"accepted"}`))
}
