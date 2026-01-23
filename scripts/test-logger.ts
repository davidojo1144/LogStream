// scripts/test-logger.ts
import fetch from "node-fetch";

// 1. Define the Logger Class (exactly as in Docs)
export class LogStream {
  private url = "https://logstream-backend.onrender.com/ingest";
  private apiKey: string;
  private serviceName: string;
  
  constructor(apiKey: string, serviceName: string) {
    this.apiKey = apiKey;
    this.serviceName = serviceName;
  }

  async log(level: "info" | "warn" | "error" | "debug", message: string, metadata?: Record<string, any>) {
    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": this.apiKey
        },
        body: JSON.stringify({
          service: this.serviceName,
          level,
          message,
          metadata
        })
      });
      
      if (res.ok) {
          console.log(`✅ Log sent: [${level}] ${message}`);
      } else {
          console.error(`❌ Failed to send log: ${res.status} ${res.statusText}`);
          const text = await res.text();
          console.error("Response:", text);
      }
    } catch (error) {
      console.error("❌ Network Error:", error);
    }
  }
}

// 2. Define the API Wrapper (exactly as in Docs)
const logger = new LogStream("pk_193f6705844c7130439b269410999767", "test-script-app");

export async function apiRequest(url: string, options?: any) {
  const start = performance.now();
  const method = options?.method || "GET";

  try {
    // Log the attempt
    console.log(`📡 Requesting: ${method} ${url}`);
    await logger.log("info", `API Request: ${method} ${url}`);

    const response = await fetch(url, options);
    const duration = Math.round(performance.now() - start);

    if (!response.ok) {
        await logger.log("error", `API Error ${response.status}: ${url}`, { 
          status: String(response.status),
          duration: `${duration}ms`
        });
        throw new Error(`HTTP ${response.status}`);
    }

    console.log(`✅ Success: ${response.status} (${duration}ms)`);
    return response;
  } catch (error) {
    await logger.log("error", `Network Failed: ${url}`, { 
      error: String(error) 
    });
    throw error;
  }
}

// 3. RUN IT!
async function main() {
    console.log("🚀 Starting Test...");

    // A. Success Case
    try {
        await apiRequest("https://jsonplaceholder.typicode.com/todos/1");
    } catch (e) {
        console.error("Test A failed:", e);
    }

    // B. Failure Case (404)
    try {
        await apiRequest("https://jsonplaceholder.typicode.com/invalid-endpoint-404");
    } catch (e: any) {
        console.log("Test B caught expected error:", e.message);
    }

    console.log("🏁 Test Complete. Check your LogStream Dashboard!");
}

main();
