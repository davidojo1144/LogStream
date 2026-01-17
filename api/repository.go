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
			Password: "password",
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

	if q.Search != "" {
		finalQuery += " AND message ILIKE ?"
		queryArgs = append(queryArgs, "%"+q.Search+"%")
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

func (r *LogRepository) GetStats(ctx context.Context, q LogQuery) ([]LogStats, error) {
	// Aggregate logs per minute
	query := `
		SELECT toStartOfMinute(timestamp) as time_bucket, count() as count
		FROM logs_db.logs
		WHERE timestamp >= ? AND timestamp <= ?
	`
	args := []interface{}{q.StartTime, q.EndTime}

	if q.Service != "" {
		query += " AND service = ?"
		args = append(args, q.Service)
	}

	query += " GROUP BY time_bucket ORDER BY time_bucket ASC"

	rows, err := r.conn.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []LogStats
	for rows.Next() {
		var s LogStats
		if err := rows.Scan(&s.Timestamp, &s.Count); err != nil {
			return nil, err
		}
		stats = append(stats, s)
	}

	return stats, nil
}
