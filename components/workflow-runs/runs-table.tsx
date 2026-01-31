"use client"

import { Check, X, Clock, Play, Ban, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface WorkflowRun {
  id: string
  workflowId: string
  workflowName: string | null
  status: "queued" | "running" | "completed" | "failed" | "cancelled"
  input: unknown
  output: unknown
  error: unknown
  createdAt: string
  updatedAt: string
  startedAt: string | null
  endedAt: string | null
}

interface RunsTableProps {
  runs: WorkflowRun[]
  selectedRunId?: string | null
  onSelectRun?: (run: WorkflowRun) => void
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDuration(startedAt: string | null, endedAt: string | null) {
  if (!startedAt) return "-"
  const start = new Date(startedAt).getTime()
  const end = endedAt ? new Date(endedAt).getTime() : Date.now()
  const diff = end - start
  if (diff < 1000) return `${diff}ms`
  if (diff < 60000) return `${(diff / 1000).toFixed(1)}s`
  return `${(diff / 60000).toFixed(1)}m`
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    queued: "bg-blue-100 text-blue-700 border-blue-200",
    running: "bg-amber-100 text-amber-700 border-amber-200",
    cancelled: "bg-gray-100 text-gray-700 border-gray-200",
  }
  const icons: Record<string, React.ReactNode> = {
    completed: <Check className="h-3 w-3" />,
    failed: <X className="h-3 w-3" />,
    queued: <Clock className="h-3 w-3" />,
    running: <Play className="h-3 w-3" />,
    cancelled: <Ban className="h-3 w-3" />,
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border ${styles[status] ?? styles.queued}`}>
      {icons[status] ?? icons.queued}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export function RunsTable({ runs, selectedRunId, onSelectRun }: RunsTableProps) {
  if (runs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">No workflow runs found.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                <div className="flex items-center gap-1">
                  Run ID
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Workflow</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Start Time</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Duration</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => {
              const isSelected = selectedRunId === run.id
              return (
                <tr
                  key={run.id}
                  onClick={() => onSelectRun?.(run)}
                  className={`border-b border-border hover:bg-slate-50 transition-colors cursor-pointer ${
                    isSelected ? "bg-primary/10 border-l-4 border-l-primary" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-primary font-medium text-xs">{run.id}</td>
                  <td className="px-4 py-3 text-foreground">{run.workflowName ?? "Unknown"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={run.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(run.startedAt ?? run.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDuration(run.startedAt, run.endedAt)}</td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectRun?.(run)
                      }}
                    >
                      {isSelected ? "Selected" : "Inspect"}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
