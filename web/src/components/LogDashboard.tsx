"use client"

import { useState } from "react"
import useSWR from "swr"
import { format } from "date-fns"
import { Activity, AlertCircle, RefreshCw, Search, Server } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface LogEntry {
  timestamp: string
  service: string
  level: string
  message: string
  metadata?: Record<string, string>
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function LogDashboard() {
  const [serviceFilter, setServiceFilter] = useState("")
  const [levelFilter, setLevelFilter] = useState("")
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)

  // Construct query params
  const queryParams = new URLSearchParams({
    limit: "100",
  })
  if (serviceFilter) queryParams.set("service", serviceFilter)
  if (levelFilter) queryParams.set("level", levelFilter)

  const { data: logs, error, mutate } = useSWR<LogEntry[]>(
    `http://localhost:8081/logs?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: isAutoRefresh ? 2000 : 0, // Poll every 2s
    }
  )

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Logs</p>
            <h3 className="text-2xl font-bold">{logs?.length || 0}</h3>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Server className="h-6 w-6 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Services</p>
            <h3 className="text-2xl font-bold">
              {new Set(logs?.map((l) => l.service)).size || 0}
            </h3>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Errors</p>
            <h3 className="text-2xl font-bold">
              {logs?.filter((l) => l.level === "error").length || 0}
            </h3>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by service..."
              className="pl-9"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            />
          </div>
          <select
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isAutoRefresh ? "secondary" : "outline"}
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isAutoRefresh && "animate-spin")} />
            {isAutoRefresh ? "Live" : "Paused"}
          </Button>
        </div>
      </div>

      {/* Log Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium w-48">Timestamp</th>
                <th className="px-4 py-3 font-medium w-32">Level</th>
                <th className="px-4 py-3 font-medium w-48">Service</th>
                <th className="px-4 py-3 font-medium">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs?.map((log, i) => (
                <tr
                  key={i}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground font-mono text-xs">
                    {format(new Date(log.timestamp), "MMM dd HH:mm:ss.SSS")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={cn(
                        "uppercase text-[10px] px-1.5 py-0.5",
                        log.level === "error" && "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900",
                        log.level === "warn" && "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900",
                        log.level === "info" && "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900",
                        log.level === "debug" && "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400"
                      )}
                    >
                      {log.level}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">{log.service}</td>
                  <td className="px-4 py-3 max-w-xl truncate" title={log.message}>
                    {log.message}
                  </td>
                </tr>
              ))}
              {(!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    {error ? "Failed to load logs" : "No logs found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
