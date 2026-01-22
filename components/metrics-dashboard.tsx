"use client"

import { Settings, ChevronDown, BarChart3, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MetricEntry {
  time: string
  message: string
  runId: string
  node: string
  tenant: string
  icon: "error" | "warning" | "info" | "flag"
}

const metricsData: MetricEntry[] = [
  { time: "12:20:48 PM", message: "Adapter Protein-LoRA failed to load", runId: "run:1cf23a9b", node: "BoltzFold", tenant: "PharmaOne", icon: "error" },
  { time: "12:22:48 AM", message: "Adapter Protein fialed failed to load", runId: "run:1cf23a9b", node: "BoltzFold", tenant: "Genemics1", icon: "warning" },
  { time: "12:25:21 AM", message: "Run Inititening.", runId: "run:1cf23a9b", node: "BoltzFold", tenant: "PharmaOne", icon: "info" },
  { time: "11:58:21 AM", message: "Information sent at failed", runId: "run:1cf23a9b", node: "BoLoFold", tenant: "PharmaOne", icon: "flag" },
]

const iconStyles = {
  error: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-500",
  flag: "text-amber-600",
}

const iconSymbols = {
  error: "!",
  warning: "▲",
  info: "→",
  flag: "⚑",
}

export function MetricsDashboard() {
  return (
    <div className="bg-card rounded-lg border border-border/50 shadow-sm">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Metrics Dashboard</h2>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-border/50 bg-transparent">
                  Last 24h
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Last 1h</DropdownMenuItem>
                <DropdownMenuItem>Last 6h</DropdownMenuItem>
                <DropdownMenuItem>Last 24h</DropdownMenuItem>
                <DropdownMenuItem>Last 7d</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="icon" className="border-border/50 bg-transparent">
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="gap-2 border-border/50 bg-transparent">
              <span className="text-primary">✦</span>
              View Full Metrics
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium w-8"></th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Message</th>
              <th className="px-4 py-3 font-medium">Run ID</th>
              <th className="px-4 py-3 font-medium">Node</th>
              <th className="px-4 py-3 font-medium">Tenant</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {metricsData.map((metric, i) => (
              <tr key={i} className="hover:bg-muted/20 transition-colors">
                <td className={`px-4 py-3 text-lg ${iconStyles[metric.icon]}`}>
                  {iconSymbols[metric.icon]}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-foreground">{metric.time}</td>
                <td className="px-4 py-3 text-foreground">
                  <span className="font-semibold">{metric.message.split(' ')[0]} {metric.message.split(' ')[1]}</span>
                  {' '}{metric.message.split(' ').slice(2).join(' ')}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{metric.runId}</td>
                <td className="px-4 py-3 text-foreground">{metric.node}</td>
                <td className="px-4 py-3 text-foreground">{metric.tenant}</td>
                <td className="px-4 py-3">
                  <Button variant="outline" size="sm" className="text-xs border-primary text-primary hover:bg-primary/10 bg-transparent">
                    <FileText className="h-3 w-3 mr-1" />
                    Details &gt;
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
