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
	log.Println("Starting Log Stream API...")

	// Configuration
	clickhouseAddr := "localhost:9000"
	serverAddr := ":8081" // Different port from collector

	// Initialize Repository
	repo, err := NewLogRepository(clickhouseAddr)
	if err != nil {
		log.Fatalf("Failed to initialize repository: %v", err)
	}

	// Initialize Handler
	handler := NewLogHandler(repo)

	// Setup Router
	mux := http.NewServeMux()
	mux.HandleFunc("/logs", handler.GetLogs)
	mux.HandleFunc("/stats", handler.GetStats)
	mux.HandleFunc("/ws", handler.WebSocketHandler)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	server := &http.Server{
		Addr:    serverAddr,
		Handler: mux,
	}

	// Graceful Shutdown
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
