#!/bin/bash

API_KEY="pk_193f6705844c7130439b269410999767"
URL="https://logstream-backend.onrender.com/ingest"

echo "🚀 Sending 30 test logs to LogStream..."

services=("payment-service" "auth-service" "frontend-web" "database-worker" "email-notifier")
levels=("info" "warn" "error" "debug")
messages=(
  "User logged in successfully"
  "Payment processing started"
  "Database connection timeout"
  "Cache miss for user profile"
  "Email sent to user@example.com"
  "Invalid password attempt"
  "Order #12345 created"
  "API rate limit exceeded"
  "Background job completed"
  "Null pointer exception in handler"
)

for i in {1..30}; do
  # Randomly select service, level, and message
  service=${services[$RANDOM % ${#services[@]}]}
  level=${levels[$RANDOM % ${#levels[@]}]}
  message=${messages[$RANDOM % ${#messages[@]}]}
  
  # Add some random metadata
  json_payload=$(cat <<EOF
{
  "service": "$service",
  "level": "$level",
  "message": "$message",
  "metadata": {
    "request_id": "req_$RANDOM",
    "latency_ms": "$((RANDOM % 500))",
    "region": "us-east-1"
  }
}
EOF
)

  echo "[$i/30] Sending $level log from $service..."
  curl -s -X POST "$URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: $API_KEY" \
    -d "$json_payload" > /dev/null

  # Sleep slightly to spread timestamps (optional, mostly for visual effect)
  sleep 0.1
done

echo "✅ Done! Check your dashboard."
