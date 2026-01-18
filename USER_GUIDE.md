# 📚 LogStream User Guide

Welcome to LogStream! This guide will teach you how to set up your account, generate API keys, and start sending logs from your applications.

---

## 1. 🔑 Setup & API Keys

1.  **Log In:** Go to your deployed LogStream dashboard (e.g., `https://log-stream-jaqq.vercel.app`).
2.  **Navigate to API Keys:** Click on the **"API Keys"** button in the top right corner.
3.  **Create a Key:**
    *   Click **"+ Create New Key"**.
    *   Give it a name (e.g., "Production Server", "Payment Service").
    *   Click **Create**.
4.  **Copy the Key:** Click the copy icon. **Keep this secret!** You will need it to send logs.

---

## 2. 📤 Sending Logs

You can send logs to LogStream from ANY programming language using a simple HTTP POST request.

**Endpoint:** `https://logstream-backend.onrender.com/ingest`
**Method:** `POST`
**Headers:**
*   `Content-Type: application/json`
*   `Authorization: YOUR_API_KEY`

### 💻 cURL (Terminal)
Test your connection instantly:

```bash
curl -X POST https://logstream-backend.onrender.com/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_API_KEY" \
  -d '{
    "service": "payment-service",
    "level": "info",
    "message": "Payment processed successfully",
    "metadata": {
      "user_id": "12345",
      "amount": "99.00"
    }
  }'
```

### 🐍 Python
```python
import requests
import datetime

url = "https://logstream-backend.onrender.com/ingest"
api_key = "YOUR_API_KEY"

payload = {
    "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
    "service": "auth-service",
    "level": "error",
    "message": "Database connection timeout",
    "metadata": {
        "retry_count": "3",
        "region": "us-east-1"
    }
}

headers = {
    "Content-Type": "application/json",
    "Authorization": api_key
}

response = requests.post(url, json=payload, headers=headers)
print(response.status_code)
```

### 📜 JavaScript / Node.js
```javascript
const axios = require('axios');

const logError = async () => {
  try {
    await axios.post('https://logstream-backend.onrender.com/ingest', {
      service: 'frontend-app',
      level: 'warn',
      message: 'Page load took > 2s',
      metadata: { path: '/dashboard', latency: '2500ms' }
    }, {
      headers: { 'Authorization': 'YOUR_API_KEY' }
    });
  } catch (err) {
    console.error('Failed to send log', err);
  }
};

logError();
```

---

## 3. 📊 Using the Dashboard

Once you start sending logs, they will appear on your dashboard instantly!

### **Live Stream**
*   If the "Live Socket" indicator is **Green**, new logs will pop up automatically.
*   The list updates in real-time.

### **Filtering**
Use the search bars at the top to filter logs:
*   **Service:** Type "payment-service" to see only payment logs.
*   **Level:** Select "ERROR" to see only critical issues.
*   **Search:** Type any keyword (e.g., "timeout", "user_123") to find specific logs.

### **Date Range**
*   Click the **Date Picker** to view historical logs from yesterday, last week, or a custom range.

---

## 4. ⚠️ Troubleshooting

**Logs not appearing?**
1.  Check your **API Key**. Is it correct?
2.  Check the **Endpoint URL**. Are you using the correct Render URL?
3.  Check the **Console**. If sending from a browser, ensure CORS is not blocking you (use a proxy or backend if needed).

**WebSocket Disconnected?**
*   The dashboard will automatically try to reconnect.
*   Refresh the page if it stays disconnected for too long.
