package main

import (
	"time"
)

type LogEntry struct {
	Timestamp   time.Time         `json:"timestamp"`
	Service     string            `json:"service"`
	Level       string            `json:"level"`
	Message     string            `json:"message"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

type LogQuery struct {
	Service   string    `json:"service"`
	Level     string    `json:"level"`
	Search    string    `json:"search"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	Limit     int       `json:"limit"`
}

type LogStats struct {
	Timestamp time.Time `json:"timestamp"`
	Count     uint64    `json:"count"`
}
