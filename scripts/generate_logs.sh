#!/bin/bash

# Log Generator Script
# Usage: ./generate_logs.sh [count] [api_key]

COUNT=${1:-10}
API_KEY=${2:-"pk_1849e650071459d82ee8eb27f45f19dd"} # Default to the key from your screenshot
API_URL="http://localhost:8080/ingest"

services=("auth-service" "payment-api" "user-service" "notification-service" "inventory-api")
levels=("info" "error" "warn" "debug")
messages=(
  "User logged in successfully"
  "Payment gateway timeout"
  "Database connection lost"
  "New order placed"
  "Cache miss for key: user:123"
  "Invalid credentials"
  "Email sent to user@example.com"
  "Stock updated for item: 555"
)

echo "Generating $COUNT logs using key: $API_KEY..."

for ((i=1; i<=COUNT; i++)); do
  service=${services[$RANDOM % ${#services[@]}]}
  level=${levels[$RANDOM % ${#levels[@]}]}
  message=${messages[$RANDOM % ${#messages[@]}]}
  
  # Add some random metadata
  json="{\"service\": \"$service\", \"level\": \"$level\", \"message\": \"$message\", \"metadata\": {\"request_id\": \"req-$RANDOM\", \"user_id\": \"$RANDOM\"}}"
  
  curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d "$json"
  
  echo "Sent log $i: [$level] $service - $message"
  sleep 0.2
done

echo "Done!"
