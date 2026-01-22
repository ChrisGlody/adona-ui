"use client"

import { RefreshCw, FileText, Flag } from "lucide-react"
import { Card } from "@/components/ui/card"

const traceData = [
  { step: 1, action: "Generate Candidates", icon: RefreshCw, latency: "1.2s", cost: "$0.02", reward: "—" },
  { step: 2, action: "Score Peptides", icon: FileText, latency: "2.4s", cost: "$0.05", reward: "8.5" },
  { step: 3, action: "Rerank List", icon: Flag, latency: "0.8s", cost: "$0.01", reward: "10.2" },
]

const tabs = ["Run Trace", "Metrics", "Logs"]

export function RunTracePanel() {
  return (
    <div className="bg-card border-t border-border">
      <div className="flex items-center border-b border-border">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              index === 0
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-4 flex gap-4">
        {/* Trace Table */}
        <div className="flex-1">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground">
                <th className="pb-2 font-medium">Step</th>
                <th className="pb-2 font-medium">Action</th>
                <th className="pb-2 font-medium">Latency</th>
                <th className="pb-2 font-medium">Cost</th>
                <th className="pb-2 font-medium">Reward</th>
              </tr>
            </thead>
            <tbody>
              {traceData.map((row) => (
                <tr key={row.step} className="text-sm border-t border-border">
                  <td className="py-2 text-foreground">{row.step}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2 text-foreground">
                      <row.icon className="h-4 w-4 text-muted-foreground" />
                      {row.action}
                    </div>
                  </td>
                  <td className="py-2 text-foreground">{row.latency}</td>
                  <td className="py-2 text-foreground">{row.cost}</td>
                  <td className="py-2 text-foreground">{row.reward}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Metrics Cards */}
        <div className="flex gap-3">
          <Card className="p-4 min-w-[140px]">
            <div className="text-sm text-muted-foreground mb-1">nDCG@10</div>
            <div className="text-2xl font-bold text-blue-600">0.85</div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }} />
            </div>
          </Card>
          
          <Card className="p-4 min-w-[120px]">
            <div className="text-sm text-muted-foreground mb-1">Pass Rate</div>
            <div className="text-2xl font-bold text-orange-500">92%</div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-orange-400 rounded-full" style={{ width: '92%' }} />
            </div>
          </Card>
          
          <Card className="p-4 min-w-[140px]">
            <div className="text-sm text-muted-foreground mb-1">Avg Cost / Ep</div>
            <div className="text-2xl font-bold text-orange-500">$0.08</div>
            <div className="mt-2 flex items-end gap-0.5 h-6">
              {[40, 60, 35, 80, 55, 45, 70].map((h, i) => (
                <div key={i} className="flex-1 bg-orange-400 rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
