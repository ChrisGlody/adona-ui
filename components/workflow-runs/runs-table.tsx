"use client"

import { Check, X, Clock, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

const runs = [
  {
    id: "PSP-159840",
    version: "1.1",
    status: "Completed",
    startTime: "Apr 15, 2024",
    duration: "2.8 min",
    inputs: "Protein FASTA (fasta)",
    outputs: "PDB File, Confidence: 95.3%",
  },
  {
    id: "PSP-159839",
    version: "1.0",
    status: "Failed",
    startTime: "Apr 15, 2024",
    duration: "3.1 min",
    inputs: "Protein FASTA (fasta)",
    outputs: "--",
  },
  {
    id: "PSP-159812",
    version: "1.1",
    status: "Queued",
    startTime: "Apr 15, 2024",
    duration: "18 min",
    inputs: "Protein FASTA (fasta)",
    outputs: "--",
  },
]

function StatusBadge({ status }: { status: string }) {
  const styles = {
    Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Failed: "bg-red-100 text-red-700 border-red-200",
    Queued: "bg-amber-100 text-amber-700 border-amber-200",
  }
  const icons = {
    Completed: <Check className="h-3 w-3" />,
    Failed: <X className="h-3 w-3" />,
    Queued: <Clock className="h-3 w-3" />,
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
      {icons[status as keyof typeof icons]}
      {status}
    </span>
  )
}

export function RunsTable() {
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
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Version</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Start Time</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Duration</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Inputs</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Outputs</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run, i) => (
              <tr key={run.id} className={`border-b border-border hover:bg-slate-50 transition-colors ${i === 0 ? "bg-primary/5" : ""}`}>
                <td className="px-4 py-3 font-mono text-primary font-medium">{run.id}</td>
                <td className="px-4 py-3 text-muted-foreground">{run.version}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={run.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{run.startTime}</td>
                <td className="px-4 py-3 text-muted-foreground">{run.duration}</td>
                <td className="px-4 py-3 text-muted-foreground">{run.inputs}</td>
                <td className="px-4 py-3 text-muted-foreground">{run.outputs}</td>
                <td className="px-4 py-3">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Inspect
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
