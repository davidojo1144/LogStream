"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Book, Code, Terminal, Activity, Shield, Zap, Globe, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
                    <Badge variant="outline">service</Badge>
                    <span className="text-muted-foreground">Name of the service sending the log (e.g., &quot;auth-service&quot;)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline">level</Badge>
                    <span className="text-muted-foreground">Log level: &quot;info&quot;, &quot;warn&quot;, &quot;error&quot;, &quot;debug&quot;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline">message</Badge>
                    <span className="text-muted-foreground">The main log content/message</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline">metadata</Badge>
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