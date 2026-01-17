package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	_ "github.com/lib/pq"
)

// PostgresProducer implements the Producer interface but writes directly to Postgres
// This is for the "Lite Mode" deployment
type PostgresProducer struct {
	db *sql.DB
}

func NewPostgresProducer(connStr string) (*PostgresProducer, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to postgres: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping postgres: %w", err)
	}

	return &PostgresProducer{db: db}, nil
}

func (p *PostgresProducer) WriteLog(entry LogEntry) error {
	metadataJson, err := json.Marshal(entry.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	query := `
		INSERT INTO "Log" (id, timestamp, service, level, message, metadata, "createdAt")
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
	`
	
	// Generate a simple timestamp-based ID for lite mode
	id := fmt.Sprintf("log_%d", time.Now().UnixNano())

	_, err = p.db.Exec(query, id, entry.Timestamp, entry.Service, entry.Level, entry.Message, metadataJson)
	if err != nil {
		return fmt.Errorf("failed to insert log to postgres: %w", err)
	}

	return nil
}

func (p *PostgresProducer) Close() error {
	return p.db.Close()
}
