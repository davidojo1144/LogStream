const axios = require('axios');

const LOGSTREAM_URL = "https://logstream-backend.onrender.com/ingest";
const SERVICE_NAME = "node-demo-service";

async function sendLog(level, message, metadata = {}) {
  try {
    await axios.post(LOGSTREAM_URL, {
      service: SERVICE_NAME,
      level,
      message,
      metadata
    });
    console.log(`Sent [${level}]: ${message}`);
  } catch (error) {
    console.error("Failed to send log:", error.message);
  }
}

// Simulate app running
console.log(`Starting ${SERVICE_NAME}...`);

setInterval(() => {
  const r = Math.random();
  if (r < 0.7) {
    sendLog("info", "Request processed successfully", { path: "/api/users" });
  } else if (r < 0.9) {
    sendLog("warn", "Rate limit approaching", { current: 95, limit: 100 });
  } else {
    sendLog("error", "Payment gateway rejected transaction", { order_id: "ord-555" });
  }
}, 1500);
