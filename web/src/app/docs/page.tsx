"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Book, Code, Terminal, Activity, Shield, Zap, Globe, ArrowRight, Copy, Check } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"

const SDK_EXAMPLES = {
  typescript: `// logger.ts
export class LogStream {
  private url = "https://logstream-backend.onrender.com/ingest";
  
  constructor(private apiKey: string, private serviceName: string) {}

  async log(level: "info" | "warn" | "error" | "debug", message: string, metadata?: Record<string, any>) {
    try {
      await fetch(this.url, {
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
    } catch (error) {
      console.error("Failed to send log to LogStream:", error);
    }
  }
}

// Usage
const logger = new LogStream("YOUR_API_KEY", "my-app");
logger.log("info", "User logged in", { userId: "123" });`,

  python: `# logger.py
import requests
import json
import threading

class LogStream:
    def __init__(self, api_key, service_name):
        self.url = "https://logstream-backend.onrender.com/ingest"
        self.api_key = api_key
        self.service_name = service_name

    def log(self, level, message, metadata=None):
        def send():
            try:
                payload = {
                    "service": self.service_name,
                    "level": level,
                    "message": message,
                    "metadata": metadata or {}
                }
                requests.post(
                    self.url,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": self.api_key
                    },
                    data=json.dumps(payload),
                    timeout=5
                )
            except Exception as e:
                print(f"Failed to send log: {e}")

        # Send asynchronously to avoid blocking main thread
        threading.Thread(target=send).start()

# Usage
logger = LogStream("YOUR_API_KEY", "my-python-app")
logger.log("error", "Database connection failed", {"db_host": "localhost"})`,

  go: `// logger.go
package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
)

type LogStream struct {
	ApiKey      string
	ServiceName string
	Client      *http.Client
}

func NewLogStream(apiKey, serviceName string) *LogStream {
	return &LogStream{
		ApiKey:      apiKey,
		ServiceName: serviceName,
		Client:      &http.Client{},
	}
}

func (l *LogStream) Log(level, message string, metadata map[string]string) {
	go func() {
		payload := map[string]interface{}{
			"service":  l.ServiceName,
			"level":    level,
			"message":  message,
			"metadata": metadata,
		}
		data, _ := json.Marshal(payload)

		req, _ := http.NewRequest("POST", "https://logstream-backend.onrender.com/ingest", bytes.NewBuffer(data))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", l.ApiKey)

		_, err := l.Client.Do(req)
		if err != nil {
			log.Printf("Failed to send log: %v", err)
		}
	}()
}

// Usage
func main() {
    logger := NewLogStream("YOUR_API_KEY", "my-go-service")
    logger.Log("warn", "Cache miss", map[string]string{"key": "user:123"})
}`
}

const INTEGRATION_EXAMPLES = {
  fetch: `// api-client.ts
import { LogStream } from "./logger"; // Import the class from above

const logger = new LogStream("YOUR_API_KEY", "frontend-app");

// This wrapper automatically logs requests and errors for you
export async function apiRequest(url: string, options?: RequestInit) {
  const start = performance.now();
  const method = options?.method || "GET";

  try {
    // 1. Log the attempt (INFO)
    logger.log("info", \`API Request: \${method} \${url}\`);

    const response = await fetch(url, options);
    const duration = Math.round(performance.now() - start);

    if (!response.ok) {
        // 2. Automatically log API errors (ERROR)
        logger.log("error", \`API Error \${response.status}: \${url}\`, { 
          status: String(response.status),
          duration: \`\${duration}ms\`
        });
        throw new Error(\`HTTP \${response.status}\`);
    }

    // 3. Automatically log slow requests (WARN)
    if (duration > 1000) {
        logger.log("warn", \`Slow Request: \${url}\`, { 
          duration: \`\${duration}ms\` 
        });
    }

    return response;
  } catch (error) {
    // 4. Log network failures (ERROR)
    logger.log("error", \`Network Failed: \${url}\`, { 
      error: String(error) 
    });
    throw error;
  }
}

// Usage in your app:
// Instead of fetch('/api/user'), you use:
// await apiRequest('/api/user');
// 
// Result: LogStream automatically receives logs for every call!`,

  react: `// ErrorBoundary.tsx
import React, { Component, ErrorInfo } from "react";
import { LogStream } from "./logger";

const logger = new LogStream("YOUR_API_KEY", "react-app");

export class GlobalErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Automatically log UI crashes to LogStream
    logger.log("error", "UI Crash: Uncaught Exception", {
      error: error.message,
      stack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Engineers have been notified.</h1>;
    }

    return this.props.children;
  }
}`
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 z-10">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-muted/80 backdrop-blur-sm hover:bg-muted"
          onClick={copyToClipboard}
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
        <pre className="text-foreground/80">{code}</pre>
      </div>
    </div>
  )
}

export default function DocumentationPage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <motion.div 
          initial="hidden"
          animate="show"
          variants={fadeIn}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 mb-8">
            <Link href="/">
              <Button variant="ghost" className="gap-2 pl-0 hover:pl-2 transition-all">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Book className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
              <p className="text-muted-foreground text-lg mt-1">
                Learn how to integrate and use LogStream.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Start */}
        <motion.section 
          initial="hidden" 
          whileInView="show" 
          viewport={{ once: true }}
          variants={fadeIn}
          className="space-y-6"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h2 className="text-2xl font-semibold">Quick Start</h2>
          </div>
          
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle>Send Your First Log</CardTitle>
              <CardDescription>
                Use this simple cURL command to test your connection. Replace <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">YOUR_API_KEY</code> with a key from the API Keys page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto relative group">
                <pre>
{`curl -X POST "https://logstream-backend.onrender.com/ingest" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: YOUR_API_KEY" \\
  -d '{
    "service": "my-app",
    "level": "info",
    "message": "Hello from LogStream!",
    "metadata": {
      "user_id": "123",
      "environment": "production"
    }
  }'`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Client SDKs */}
        <motion.section 
          initial="hidden" 
          whileInView="show" 
          viewport={{ once: true }}
          variants={fadeIn}
          className="space-y-6"
        >
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-500" />
            <h2 className="text-2xl font-semibold">Client SDK Starter Kits</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ready-to-use Libraries</CardTitle>
              <CardDescription>
                Copy and paste these snippets to start logging from your applications in minutes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="typescript" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="typescript">TypeScript / Node.js</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="go">Go (Golang)</TabsTrigger>
                </TabsList>
                <TabsContent value="typescript">
                  <CodeBlock code={SDK_EXAMPLES.typescript} language="typescript" />
                </TabsContent>
                <TabsContent value="python">
                  <CodeBlock code={SDK_EXAMPLES.python} language="python" />
                </TabsContent>
                <TabsContent value="go">
                  <CodeBlock code={SDK_EXAMPLES.go} language="go" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.section>

        {/* Real-world Patterns */}
        <motion.section 
          initial="hidden" 
          whileInView="show" 
          viewport={{ once: true }}
          variants={fadeIn}
          className="space-y-6"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h2 className="text-2xl font-semibold">Automatic Integration Patterns</h2>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>How to Log Automatically</CardTitle>
              <CardDescription>
                Instead of manually calling <code>logger.log()</code> everywhere, use these patterns to capture events automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="fetch" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="fetch">Smart Fetch Wrapper</TabsTrigger>
                  <TabsTrigger value="react">React Error Boundary</TabsTrigger>
                </TabsList>
                <TabsContent value="fetch">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Replace your native <code>fetch</code> calls with this wrapper. It automatically logs successful requests, catches network errors, and warns you about slow APIs.
                    </p>
                    <CodeBlock code={INTEGRATION_EXAMPLES.fetch} language="typescript" />
                  </div>
                </TabsContent>
                <TabsContent value="react">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Wrap your main App component with this Error Boundary. It will catch any React rendering crash and send the stack trace to LogStream.
                    </p>
                    <CodeBlock code={INTEGRATION_EXAMPLES.react} language="typescript" />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.section>

        {/* Integration Guide */}
        <motion.section 
          initial="hidden" 
          whileInView="show" 
          viewport={{ once: true }}
          variants={fadeIn}
          className="space-y-6"
        >
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-500" />
            <h2 className="text-2xl font-semibold">Integration Guide</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  JSON Payload Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your request body must be a JSON object with the following fields:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Badge>service</Badge>
                    <span className="text-muted-foreground">Name of the service sending the log (e.g., &quot;auth-service&quot;)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge>level</Badge>
                    <span className="text-muted-foreground">Log level: &quot;info&quot;, &quot;warn&quot;, &quot;error&quot;, &quot;debug&quot;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge>message</Badge>
                    <span className="text-muted-foreground">The main log content/message</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge>metadata</Badge>
                    <span className="text-muted-foreground">(Optional) Key-value pairs for extra context</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  All ingestion requests require an API Key.
                </p>
                <div className="space-y-2 text-sm">
                  <p>1. Go to the <strong>API Keys</strong> page in the dashboard.</p>
                  <p>2. Create a new key (e.g., &quot;Production Key&quot;).</p>
                  <p>3. Include it in the <code className="bg-muted px-1 py-0.5 rounded font-mono">Authorization</code> header.</p>
                </div>
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-600 dark:text-yellow-400">
                  ⚠️ Keep your API keys secret. Never expose them in client-side code (browsers).
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Features */}
        <motion.section 
          initial="hidden" 
          whileInView="show" 
          viewport={{ once: true }}
          variants={fadeIn}
          className="space-y-6"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            <h2 className="text-2xl font-semibold">Features & Capabilities</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Real-time Streaming</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Logs appear instantly on your dashboard via WebSockets. No page refresh needed.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Powerful Filtering</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Filter by Service, Log Level, or search keywords to find exactly what you need.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Logs are stored securely in PostgreSQL. The &quot;All Time&quot; view lets you access historical data.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Deployment */}
        <motion.section 
          initial="hidden" 
          whileInView="show" 
          viewport={{ once: true }}
          variants={fadeIn}
          className="space-y-6 pb-12"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-500" />
            <h2 className="text-2xl font-semibold">Deployment</h2>
          </div>
          
          <Card>
             <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-4">
                  LogStream is designed to be self-hosted or deployed on cloud platforms.
                </p>
                <div className="flex gap-4">
                   <Link href="https://github.com/davidojo1144/LogStream" target="_blank">
                      <Button variant="outline" className="gap-2">
                        View on GitHub
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                   </Link>
                </div>
             </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  )
}