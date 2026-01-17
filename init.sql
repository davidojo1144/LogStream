CREATE DATABASE IF NOT EXISTS logs_db;

CREATE TABLE IF NOT EXISTS logs_db.logs (
    timestamp DateTime64(3),
    service LowCardinality(String),
    level LowCardinality(String),
    message String,
    metadata Map(String, String)
) ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (service, timestamp);
