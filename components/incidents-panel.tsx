"use client"

import { ChevronRight, ArrowRight } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface RetryEntry {
  time: string
  errorType: string
  retries: string
  lastStatus: string
}

const retriesData: RetryEntry[] = [
  { time: "12:20 PM", errorType: "Adapter Load Error", retries: "Manual", lastStatus: "" },
  { time: "11:58 AM", errorType: "Execution Timeout", retries: "Auto", lastStatus: "" },
  { time: "11:21 AM", errorType: "Execution Timeout", retries: "Auto", lastStatus: "" },
  { time: "10:44 AM", errorType: "API Rate Limit", retries: "Limit", lastStatus: "Exceeded" },
  { time: "8:51 AM", errorType: "API Rate Limit", retries: "Limit", lastStatus: "Exceeded" },
]

export function IncidentsPanel() {
  return (
    <div className="bg-card rounded-lg border border-border/50 shadow-sm h-fit">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold text-foreground">Incidents & Retries</h2>
      </div>

      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">5</span>
            <span className="text-foreground font-medium">Current Incidents</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">1.4k / past 30 days</p>
      </div>

      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground">Retry Policy</span>
          <div className="flex items-center gap-2">
            <Switch defaultChecked className="data-[state=checked]:bg-primary" />
            <span className="text-xs text-muted-foreground">Automatic<br />Retries</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-left text-muted-foreground text-xs">
              <th className="px-3 py-2 font-medium">Time</th>
              <th className="px-3 py-2 font-medium">Error <span className="text-primary">Ty</span></th>
              <th className="px-3 py-2 font-medium">Retries</th>
              <th className="px-3 py-2 font-medium">Last Dat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {retriesData.map((entry, i) => (
              <tr key={i} className="hover:bg-muted/20">
                <td className="px-3 py-2 text-xs text-muted-foreground">{entry.time}</td>
                <td className="px-3 py-2 text-xs font-medium text-foreground">{entry.errorType}</td>
                <td className="px-3 py-2 text-xs text-foreground">{entry.retries}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{entry.lastStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4">
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          Incident Overview
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
