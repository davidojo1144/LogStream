"use client"

import { useState } from "react"
import { Bell, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"

interface AlertConfig {
  id: string
  metric: string
  condition: string
  threshold: number
  email: string
}

export function AlertsDialog() {
  const [alerts, setAlerts] = useState<AlertConfig[]>([])
  const [newAlert, setNewAlert] = useState<Partial<AlertConfig>>({
    metric: "error_count",
    condition: "gt",
    threshold: 10,
    email: "",
  })

  const addAlert = () => {
    if (newAlert.email) {
      setAlerts([
        ...alerts,
        { ...newAlert, id: Math.random().toString(36).substr(2, 9) } as AlertConfig,
      ])
      setNewAlert({ ...newAlert, email: "" }) // Reset email field
    }
  }

  const removeAlert = (id: string) => {
    setAlerts(alerts.filter((a) => a.id !== id))
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Bell className="h-4 w-4" />
          Alerts
          {alerts.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {alerts.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configure Alerts</DialogTitle>
          <DialogDescription>
            Receive notifications when specific log conditions are met.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col gap-4 p-4 bg-muted/50 rounded-lg border">
            <h4 className="font-medium text-sm">Create New Alert</h4>
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={newAlert.metric}
                onValueChange={(v) => setNewAlert({ ...newAlert, metric: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="error_count">Error Count</SelectItem>
                  <SelectItem value="log_volume">Log Volume</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Select
                  value={newAlert.condition}
                  onValueChange={(v) => setNewAlert({ ...newAlert, condition: v })}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gt">{">"}</SelectItem>
                    <SelectItem value="lt">{"<"}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={newAlert.threshold}
                  onChange={(e) =>
                    setNewAlert({ ...newAlert, threshold: parseInt(e.target.value) })
                  }
                  className="flex-1"
                />
              </div>
            </div>
            <Input
              placeholder="Email Address"
              type="email"
              value={newAlert.email}
              onChange={(e) => setNewAlert({ ...newAlert, email: e.target.value })}
            />
            <Button onClick={addAlert} className="w-full gap-2">
              <Plus className="h-4 w-4" /> Add Alert Rule
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Active Alerts</h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              <AnimatePresence>
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between p-3 bg-card border rounded-md shadow-sm"
                  >
                    <div className="text-sm">
                      <span className="font-medium">
                        {alert.metric === "error_count" ? "Errors" : "Logs"}
                      </span>{" "}
                      {alert.condition === "gt" ? ">" : "<"} {alert.threshold} / min
                      <div className="text-xs text-muted-foreground">{alert.email}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAlert(alert.id)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
                {alerts.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    No alerts configured
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
