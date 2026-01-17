package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"
)

type LogHandler struct {
	repo *LogRepository
}

func NewLogHandler(repo *LogRepository) *LogHandler {
	return &LogHandler{repo: repo}
}

func (h *LogHandler) GetLogs(w http.ResponseWriter, r *http.Request) {
	// Enable CORS for frontend
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		return
	}

	query := r.URL.Query()
	
	// Defaults
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

	q := LogQuery{
		Service:   query.Get("service"),
		Level:     query.Get("level"),
		StartTime: startTime,
		EndTime:   endTime,
		Limit:     limit,
	}

	logs, err := h.repo.GetLogs(r.Context(), q)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}
