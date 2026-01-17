import requests
import time
import random

# Configuration
LOGSTREAM_URL = "http://localhost:8080/ingest"
SERVICE_NAME = "python-demo-service"

def send_log(level, message, metadata=None):
    payload = {
        "service": SERVICE_NAME,
        "level": level,
        "message": message,
        "metadata": metadata or {}
    }
    try:
        response = requests.post(LOGSTREAM_URL, json=payload, timeout=0.5)
        print(f"Sent [{level}]: {message} -> {response.status_code}")
    except Exception as e:
        print(f"Failed to send log: {e}")

if __name__ == "__main__":
    print(f"Starting {SERVICE_NAME}...")
    
    while True:
        # Simulate some activity
        actions = [
            ("info", "User login successful"),
            ("info", "Page view: /dashboard"),
            ("warn", "API response slow (1.2s)"),
            ("error", "Database connection timeout"),
            ("debug", "Variable x = 42")
        ]
        
        level, msg = random.choice(actions)
        send_log(level, msg, {"env": "production"})
        
        time.sleep(2)
