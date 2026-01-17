package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	log.Println("Starting Log Collector Service...")

	// Configuration (Environment Variables in a real app)
	kafkaBrokers := []string{"localhost:9092"} // Assuming running locally for now
	kafkaTopic := "logs"
	serverAddr := ":8080"

	// Initialize Kafka Producer
	producer := NewKafkaProducer(kafkaBrokers, kafkaTopic)
	defer producer.Close()

	// Initialize HTTP Handler
	handler := NewLogHandler(producer)

	// Setup Router
	mux := http.NewServeMux()
	mux.HandleFunc("/ingest", handler.HandleLog)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	server := &http.Server{
		Addr:    serverAddr,
		Handler: mux,
	}

	// Graceful Shutdown Channel
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("Listening on %s", serverAddr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	<-done
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited properly")
}
