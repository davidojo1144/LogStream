# LogStream SDKs & Integration Guide

To send logs to LogStream, you must first create an **API Key** from the dashboard.

## 🔑 Authentication

Include your API Key in the `Authorization` header of every request.
`Authorization: Bearer <YOUR_API_KEY>`

## 🔗 Endpoint

`POST http://localhost:8080/ingest`

## 📦 Payload Format (JSON)

```json
{
  "service": "your-app-name",
  "level": "info", // "info", "warn", "error", "debug"
  "message": "Something happened",
  "metadata": {
    "user_id": "123",
    "request_id": "abc-xyz"
  }
}
```

---

## 🛠 Integration Examples

### 1. Python (using `requests`)

```python
import requests
import json

API_KEY = "pk_your_api_key_here"

def log(level, message, metadata=None):
    url = "http://localhost:8080/ingest"
    headers = {"Authorization": f"Bearer {API_KEY}"}
    payload = {
        "service": "python-backend",
        "level": level,
        "message": message,
        "metadata": metadata or {}
    }
    try:
        requests.post(url, json=payload, headers=headers, timeout=1)
    except Exception as e:
        print(f"Failed to send log: {e}")
```

### 2. Node.js / JavaScript (using `fetch`)

```javascript
const API_KEY = "pk_your_api_key_here";

async function log(level, message, metadata = {}) {
  try {
    await fetch("http://localhost:8080/ingest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        service: "node-api",
        level,
        message,
        metadata,
      }),
    });
  } catch (err) {
    console.error("LogStream Error:", err);
  }
}
```

### 3. cURL (Terminal)

```bash
curl -X POST http://localhost:8080/ingest \
  -H "Authorization: Bearer pk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"service":"cron-job", "level":"info", "message":"Backup completed"}'
```
