package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

const LogStreamURL = "https://logstream-backend.onrender.com/ingest"

type LogPayload struct {
	Service  string            `json:"service"`
	Level    string            `json:"level"`
	Message  string            `json:"message"`
	Metadata map[string]string `json:"metadata"`
}

func SendLog(level, message string) {
	payload := LogPayload{
		Service: "go-demo-service",
		Level:   level,
		Message: message,
		Metadata: map[string]string{
			"region": "us-east-1",
		},
	}

	jsonData, _ := json.Marshal(payload)
	resp, err := http.Post(LogStreamURL, "application/json", bytes.NewBuffer(jsonData))
	
	if err != nil {
		fmt.Printf("Error sending log: %v\n", err)
		return
	}
	defer resp.Body.Close()
	fmt.Printf("Sent [%s]: %s\n", level, message)
}

func main() {
	fmt.Println("Starting Go Log Producer...")
	
	for {
		SendLog("info", "Worker heartbeat pulse")
		time.Sleep(1 * time.Second)
		SendLog("debug", "Processing batch #992")
		time.Sleep(2 * time.Second)
	}
}
