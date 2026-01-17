# LogStream

## Distributed Log Aggregator & Visualizer

LogStream is a high-performance log aggregation system designed to ingest, store, and visualize logs from multiple services in real-time.

### Tech Stack
- **Collector:** Go (High throughput log ingestion)
- **Message Broker:** Kafka (Buffering)
- **Storage:** ClickHouse (OLAP Database for logs)
- **API:** Go (Querying and management)
- **Frontend:** Next.js + TailwindCSS + ShadcnUI (Visualization Dashboard)

### Architecture
[Service] -> [Collector (Go)] -> [Kafka] -> [ClickHouse] <- [API (Go)] <- [Dashboard (Next.js)]

### Getting Started

#### Prerequisites
- Docker & Docker Compose
- Go 1.21+
- Node.js 18+

#### Running Infrastructure
```bash
docker-compose up -d
```

#### Running Collector
```bash
cd collector
go run main.go
```

#### Running API
```bash
cd api
go run main.go
```

#### Running Dashboard
```bash
cd web
npm run dev
```
