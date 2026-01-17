package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/segmentio/kafka-go"
)

type KafkaProducer struct {
	writer *kafka.Writer
}

func NewKafkaProducer(brokers []string, topic string) *KafkaProducer {
	writer := &kafka.Writer{
		Addr:     kafka.TCP(brokers...),
		Topic:    topic,
		Balancer: &kafka.LeastBytes{},
		// Optimized for throughput
		BatchSize:  100,
		BatchTimeout: 10 * time.Millisecond,
		Async:      true,
	}

	return &KafkaProducer{
		writer: writer,
	}
}

func (p *KafkaProducer) WriteLog(entry LogEntry) error {
	value, err := json.Marshal(entry)
	if err != nil {
		return fmt.Errorf("failed to marshal log entry: %w", err)
	}

	// We use the Service name as the key to ensure logs from the same service 
	// end up in the same partition if we wanted strict ordering, 
	// but LeastBytes balancer might distribute differently.
	// For now, let's keep it simple.
	err = p.writer.WriteMessages(context.Background(),
		kafka.Message{
			Key:   []byte(entry.Service),
			Value: value,
		},
	)

	if err != nil {
		return fmt.Errorf("failed to write message to kafka: %w", err)
	}

	return nil
}

func (p *KafkaProducer) Close() error {
	return p.writer.Close()
}
