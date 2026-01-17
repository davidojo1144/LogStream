"use client"

import { useState } from "react"
import useSWR from "swr"
import { format } from "date-fns"
import { Activity, AlertCircle, RefreshCw, Search, Server, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { signOut, useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ModeToggle } from "@/components/mode-toggle"
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
  const { data: session } = useSession()
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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            LogStream
          </h1>
          <p className="text-muted-foreground mt-1">
            Distributed Log Aggregator & Visualizer
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle />
          <div className="flex items-center gap-2 px-4 py-2 bg-card border rounded-full shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">{session?.user?.name || "User"}</span>
          </div>
          <Button variant="outline" size="icon" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={item} className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 flex items-center gap-6 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="p-4 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
            <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Logs</p>
            <h3 className="text-3xl font-bold">{logs?.length || 0}</h3>
          </div>
        </motion.div>
        
        <motion.div variants={item} className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 flex items-center gap-6 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="p-4 bg-purple-500/10 rounded-2xl group-hover:bg-purple-500/20 transition-colors">
            <Server className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Services</p>
            <h3 className="text-3xl font-bold">
              {new Set(logs?.map((l) => l.service)).size || 0}
            </h3>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 flex items-center gap-6 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="p-4 bg-red-500/10 rounded-2xl group-hover:bg-red-500/20 transition-colors">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Errors</p>
            <h3 className="text-3xl font-bold">
              {logs?.filter((l) => l.level === "error").length || 0}
            </h3>
          </div>
        </motion.div>
      </motion.div>

      {/* Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/50 backdrop-blur-sm p-4 rounded-2xl border shadow-sm"
      >
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by service..."
              className="pl-10 bg-background/50 border-transparent focus:border-primary focus:bg-background transition-all"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-md border border-input bg-background/50 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
            className={cn("gap-2 transition-all", isAutoRefresh && "bg-green-500/10 text-green-600 border-green-200 dark:border-green-900")}
          >
            <RefreshCw className={cn("h-4 w-4", isAutoRefresh && "animate-spin")} />
            {isAutoRefresh ? "Live Updates" : "Paused"}
          </Button>
        </div>
      </motion.div>

      {/* Log Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 text-muted-foreground border-b">
              <tr>
                <th className="px-6 py-4 font-medium w-48">Timestamp</th>
                <th className="px-6 py-4 font-medium w-32">Level</th>
                <th className="px-6 py-4 font-medium w-48">Service</th>
                <th className="px-6 py-4 font-medium">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <AnimatePresence mode="popLayout">
                {logs?.map((log, i) => (
                  <motion.tr
                    key={`${log.timestamp}-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground font-mono text-xs">
                      {format(new Date(log.timestamp), "MMM dd HH:mm:ss.SSS")}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={cn(
                          "uppercase text-[10px] px-2 py-1 shadow-sm",
                          log.level === "error" && "bg-red-500/10 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900",
                          log.level === "warn" && "bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900",
                          log.level === "info" && "bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900",
                          log.level === "debug" && "bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400"
                        )}
                      >
                        {log.level}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                        {log.service}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xl truncate text-foreground/80" title={log.message}>
                      {log.message}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {(!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="w-8 h-8 opacity-20" />
                      <p>{error ? "Failed to load logs" : "No logs found"}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
