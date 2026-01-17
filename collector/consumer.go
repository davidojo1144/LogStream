package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2"
	"github.com/segmentio/kafka-go"
)

type Consumer struct {
	reader *kafka.Reader
	db     clickhouse.Conn
}

func NewConsumer(brokers []string, topic string, dbAddr string) (*Consumer, error) {
	// Initialize Kafka Reader
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  brokers,
		Topic:    topic,
		GroupID:  "logstream-group",
		MinBytes: 10e3, // 10KB
		MaxBytes: 10e6, // 10MB
	})

	// Initialize ClickHouse Connection
	conn, err := clickhouse.Open(&clickhouse.Options{
		Addr: []string{dbAddr},
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

	return &Consumer{
		reader: reader,
		db:     conn,
	}, nil
}

func (c *Consumer) Start(ctx context.Context) {
	log.Println("Starting Kafka Consumer...")

	// Batch insertion loop
	batchSize := 1000
	batch := make([]LogEntry, 0, batchSize)
	ticker := time.NewTicker(2 * time.Second)

	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		default:
			// Read message from Kafka
			m, err := c.reader.ReadMessage(ctx)
			if err != nil {
				log.Printf("Error reading message: %v", err)
				continue
			}

			var entry LogEntry
			if err := json.Unmarshal(m.Value, &entry); err != nil {
				log.Printf("Error unmarshaling message: %v", err)
				continue
			}

			batch = append(batch, entry)

			// Insert if batch is full
			if len(batch) >= batchSize {
				if err := c.insertBatch(ctx, batch); err != nil {
					log.Printf("Error inserting batch: %v", err)
				} else {
					batch = batch[:0] // Reset batch
				}
			}
			
			// Check for time-based flush
			select {
			case <-ticker.C:
				if len(batch) > 0 {
					if err := c.insertBatch(ctx, batch); err != nil {
						log.Printf("Error inserting batch on tick: %v", err)
					} else {
						batch = batch[:0]
					}
				}
			default:
			}
		}
	}
}

func (c *Consumer) insertBatch(ctx context.Context, logs []LogEntry) error {
	batch, err := c.db.PrepareBatch(ctx, "INSERT INTO logs_db.logs")
	if err != nil {
		return err
	}

	for _, l := range logs {
		if err := batch.Append(
			l.Timestamp,
			l.Service,
			l.Level,
			l.Message,
			l.Metadata,
		); err != nil {
			return err
		}
	}

	return batch.Send()
}
