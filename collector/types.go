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
