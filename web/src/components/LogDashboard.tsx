"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { format, subDays } from "date-fns"
import { Activity, AlertCircle, RefreshCw, Search, Server, LogOut, Loader2, Key, Book } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { signOut, useSession } from "next-auth/react"
import { DateRange } from "react-day-picker"
import Link from "next/link"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"
import { LogChart } from "@/components/LogChart"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { AlertsDialog } from "@/components/AlertsDialog"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface LogEntry {
  timestamp: string
  service: string
  level: string
  message: string
  metadata?: Record<string, string>
}

interface LogStats {
  timestamp: string
  count: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function LogDashboard() {
  const { data: session } = useSession()
  const [serviceFilter, setServiceFilter] = useState("")
  const [levelFilter, setLevelFilter] = useState("")
  const [searchFilter, setSearchFilter] = useState("")
  // Default to undefined (All Time) as per user request
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)
  const [wsConnected, setWsConnected] = useState(false)
  const [realtimeLogs, setRealtimeLogs] = useState<LogEntry[]>([])
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)

  // Query Params Construction
  const queryParams = new URLSearchParams({ limit: "100" })
  if (serviceFilter) queryParams.set("service", serviceFilter)
  if (levelFilter) queryParams.set("level", levelFilter)
  if (searchFilter) queryParams.set("search", searchFilter)
  if (dateRange?.from) queryParams.set("start_time", dateRange.from.toISOString())
  if (dateRange?.to) queryParams.set("end_time", dateRange.to.toISOString())

  // Fetch Historical Logs
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"
  const { data: historicalLogs, error, mutate } = useSWR<LogEntry[]>(
    `${apiUrl}/logs?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: isAutoRefresh && !wsConnected ? 2000 : 0,
    }
  )

  // Fetch Stats for Chart
  const { data: stats } = useSWR<LogStats[]>(
    `${apiUrl}/stats?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 5000,
    }
  )

  // WebSocket Integration
  useEffect(() => {
    if (!isAutoRefresh) return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8081"
    const ws = new WebSocket(`${wsUrl}/ws`)

    ws.onopen = () => {
      setWsConnected(true)
      console.log("Connected to Log Stream")
    }

    ws.onmessage = (event) => {
      try {
        const newLogs: LogEntry[] = JSON.parse(event.data)
        setRealtimeLogs((prev) => {
          // Keep only last 100 logs in realtime buffer
          const combined = [...newLogs, ...prev].slice(0, 100)
          return combined
        })
      } catch (e) {
        console.error("Failed to parse WS message", e)
      }
    }

    ws.onclose = () => {
      setWsConnected(false)
      console.log("Disconnected from Log Stream")
    }

    return () => {
      ws.close()
    }
  }, [isAutoRefresh])

  // Merge Realtime and Historical Logs
  // Priority: Realtime logs (if connected) -> Historical logs
  const displayLogs = wsConnected && realtimeLogs.length > 0 
    ? realtimeLogs 
    : historicalLogs || []

  // Animation Variants
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Distributed Log Aggregator
            {wsConnected && (
              <span className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Socket
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle />
          <Link href="/docs">
            <Button variant="outline" size="sm" className="gap-2">
              <Book className="h-4 w-4" />
              Docs
            </Button>
          </Link>
          <Link href="/api-keys">
            <Button variant="outline" size="sm" className="gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </Button>
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 bg-card border rounded-full shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">{session?.user?.name || "User"}</span>
          </div>

          <Button variant="outline" size="icon" onClick={() => setIsLogoutOpen(true)}>
            <LogOut className="h-4 w-4" />
          </Button>

          {/* Custom Logout Modal */}
          <AnimatePresence>
            {isLogoutOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsLogoutOpen(false)}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                />
                
                {/* Modal */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border rounded-xl shadow-xl z-50 p-6 space-y-4"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Confirm Logout</h2>
                    <p className="text-muted-foreground">
                      Are you sure you want to sign out? You will need to log in again to access the dashboard.
                    </p>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setIsLogoutOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={() => signOut()}>
                      Log Out
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="lg:col-span-1 space-y-6"
        >
          {/* Stat Cards */}
          <motion.div variants={item} className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-all">
            <div className="p-4 bg-blue-500/10 rounded-2xl">
              <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Logs</p>
              <h3 className="text-3xl font-bold">{displayLogs.length}</h3>
            </div>
          </motion.div>
          
          <motion.div variants={item} className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-all">
            <div className="p-4 bg-red-500/10 rounded-2xl">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Errors</p>
              <h3 className="text-3xl font-bold">
                {displayLogs.filter((l) => l.level === "error").length}
              </h3>
            </div>
          </motion.div>
        </motion.div>

        {/* Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card/50 backdrop-blur-sm border rounded-2xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-4">Log Volume</h3>
          {stats ? (
            <LogChart data={stats} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}
        </motion.div>
      </div>

      {/* Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-card/50 backdrop-blur-sm p-4 rounded-2xl border shadow-sm"
      >
        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              className="pl-10 bg-background/50"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select
              className="h-10 rounded-md border border-input bg-background/50 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full md:w-32"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
              <option value="debug">Debug</option>
            </select>
            <Input
              placeholder="Service..."
              className="w-full md:w-32 bg-background/50"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            />
          </div>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>

        <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
          <AlertsDialog />
          <Button
            variant={isAutoRefresh ? "secondary" : "outline"}
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={cn("gap-2 transition-all", isAutoRefresh && "bg-green-500/10 text-green-600 border-green-200 dark:border-green-900")}
          >
            <RefreshCw className={cn("h-4 w-4", isAutoRefresh && "animate-spin")} />
            {isAutoRefresh ? "Live" : "Paused"}
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
                {displayLogs.map((log, i) => (
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
              {displayLogs.length === 0 && (
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
