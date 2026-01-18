package main

import (
	"database/sql"
	"fmt"
	"log"
	"strings"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type ApiKeyValidator struct {
	db *sql.DB
}

func NewApiKeyValidator(connStr string) (*ApiKeyValidator, error) {
	// Force simple protocol for Supabase Transaction Mode compatibility
	if !strings.Contains(connStr, "default_query_exec_mode") {
		if strings.Contains(connStr, "?") {
			connStr += "&default_query_exec_mode=simple_protocol"
		} else {
			connStr += "?default_query_exec_mode=simple_protocol"
		}
	}

	db, err := sql.Open("pgx", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to postgres: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping postgres: %w", err)
	}

	return &ApiKeyValidator{db: db}, nil
}

func (v *ApiKeyValidator) Validate(key string) bool {
	// Remove "Bearer " prefix if present
	cleanKey := strings.TrimPrefix(key, "Bearer ")
	
	// Check if key exists and is active
	// Note: In high-scale production, you would cache this in Redis
	var exists bool
	err := v.db.QueryRow("SELECT active FROM \"ApiKey\" WHERE key = $1", cleanKey).Scan(&exists)
	
	if err != nil {
		if err != sql.ErrNoRows {
			log.Printf("Database error validating key: %v", err)
		}
		return false
	}
	
	return exists
}

func (v *ApiKeyValidator) Close() {
	v.db.Close()
}
