"use client"

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import { format } from "date-fns"
import { useTheme } from "next-themes"

interface LogStats {
  timestamp: string
  count: number
}

interface LogChartProps {
  data: LogStats[]
}

export function LogChart({ data }: LogChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const formattedData = data.map((item) => ({
    time: format(new Date(item.timestamp), "HH:mm"),
    count: item.count,
  }))

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
          <XAxis
            dataKey="time"
            stroke={isDark ? "#888" : "#666"}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={isDark ? "#888" : "#666"}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#1f2937" : "#fff",
              border: "none",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            cursor={{ fill: isDark ? "#374151" : "#f3f4f6" }}
          />
          <Bar
            dataKey="count"
            fill="url(#colorCount)"
            radius={[4, 4, 0, 0]}
            className="fill-primary"
          />
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
