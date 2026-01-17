package main

import (
	"context"
	"fmt"

	"github.com/ClickHouse/clickhouse-go/v2"
)

type LogRepository struct {
	conn clickhouse.Conn
}

func NewLogRepository(addr string) (*LogRepository, error) {
	conn, err := clickhouse.Open(&clickhouse.Options{
		Addr: []string{addr},
		Auth: clickhouse.Auth{
			Database: "logs_db",
			Username: "default",
			Password: "",
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to clickhouse: %w", err)
	}

	if err := conn.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ping clickhouse: %w", err)
	}

	return &LogRepository{conn: conn}, nil
}

func (r *LogRepository) GetLogs(ctx context.Context, q LogQuery) ([]LogEntry, error) {
	query := `
		SELECT timestamp, service, level, message, metadata
		FROM logs_db.logs
		WHERE timestamp >= $1 AND timestamp <= $2
	`
	args := []interface{}{q.StartTime, q.EndTime}

	if q.Service != "" {
		query += " AND service = $3"
		args = append(args, q.Service)
	}
	
	// Note: Simple query builder. In production, use a builder lib or be careful with args index
	// Here we just append. ClickHouse driver uses $1, $2, etc.
	// Actually, let's just keep it simple and safe.
	// Re-building for correct parameter indexing:
	
	finalQuery := `SELECT timestamp, service, level, message, metadata FROM logs_db.logs WHERE timestamp >= ? AND timestamp <= ?`
	queryArgs := []interface{}{q.StartTime, q.EndTime}

	if q.Service != "" {
		finalQuery += " AND service = ?"
		queryArgs = append(queryArgs, q.Service)
	}

	if q.Level != "" {
		finalQuery += " AND level = ?"
		queryArgs = append(queryArgs, q.Level)
	}

	finalQuery += " ORDER BY timestamp DESC LIMIT ?"
	queryArgs = append(queryArgs, q.Limit)

	rows, err := r.conn.Query(ctx, finalQuery, queryArgs...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []LogEntry
	for rows.Next() {
		var l LogEntry
		if err := rows.Scan(&l.Timestamp, &l.Service, &l.Level, &l.Message, &l.Metadata); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}

	return logs, nil
}
