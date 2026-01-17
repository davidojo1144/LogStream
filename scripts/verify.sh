#!/bin/bash
set -e

# Setup Local Go Path
export PATH=$PWD/.tools/go/bin:$PATH

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "🚀 Starting System Verification..."

# Check Go
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go is not installed or not in PATH.${NC}"
    exit 1
fi
GO_VERSION=$(go version)
echo -e "${GREEN}✅ Found Go: $GO_VERSION${NC}"

# 1. Build Services
echo "📦 Building Services..."
(cd collector && go mod tidy && go build -o ../bin/collector .)
(cd api && go mod tidy && go build -o ../bin/api .)
echo -e "${GREEN}✅ Build Successful${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker is not installed. Skipping runtime verification.${NC}"
    echo -e "${YELLOW}👉 Please install Docker Desktop manually to run the full system.${NC}"
    exit 0
fi

# 2. Start Services (Only if Docker is present)
echo "▶️  Starting Infrastructure..."
docker compose up -d

echo "⏳ Waiting for services to be ready (30s)..."
sleep 30

echo "▶️  Starting Collector (Port 8080)..."
./bin/collector > collector.log 2>&1 &
COLLECTOR_PID=$!

echo "▶️  Starting API (Port 8081)..."
./bin/api > api.log 2>&1 &
API_PID=$!

# Give them a moment to start
sleep 5

# 3. Send Test Log
echo "📨 Sending Test Log to Collector..."
TEST_ID="test-$(date +%s)"
curl -s -X POST http://localhost:8080/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "service": "verification-script",
    "level": "info",
    "message": "System verification test log",
    "metadata": {"test_id": "'"$TEST_ID"'"}
  }'

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Log sent successfully${NC}"
else
    echo -e "${RED}❌ Failed to send log${NC}"
    kill $COLLECTOR_PID $API_PID
    exit 1
fi

# 4. Wait for Processing
echo "⏳ Waiting 5s for Kafka -> ClickHouse processing..."
sleep 5

# 5. Query API
echo "🔍 Querying API for the log..."
RESPONSE=$(curl -s "http://localhost:8081/logs?service=verification-script&limit=1")

echo "Response: $RESPONSE"

if [[ "$RESPONSE" == *"$TEST_ID"* ]]; then
    echo -e "${GREEN}✅ Verification PASSED: Found log with ID $TEST_ID${NC}"
else
    echo -e "${RED}❌ Verification FAILED: Log not found in API response${NC}"
    echo "Check collector.log and api.log for details."
fi

# 6. Cleanup
echo "🧹 Cleaning up processes..."
kill $COLLECTOR_PID $API_PID
# docker-compose down # Optional: keep it running for the user
echo "Done."
