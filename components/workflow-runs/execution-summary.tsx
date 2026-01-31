"use client"

import { Check, X, Clock, Play, Ban } from "lucide-react"

interface ExecutionSummaryProps {
  total: number
  completed: number
  failed: number
  running: number
  queued: number
}

export function ExecutionSummary({ total, completed, failed, running, queued }: ExecutionSummaryProps) {
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="bg-white rounded-xl border border-border p-5 h-fit">
      <h3 className="font-semibold text-foreground mb-4">Execution Summary</h3>

      <div className="space-y-4">
        {/* Total Runs */}
        <div className="text-center py-4 border-b border-border">
          <div className="text-4xl font-bold text-foreground">{total}</div>
          <div className="text-sm text-muted-foreground">Total Runs</div>
        </div>

        {/* Success Rate */}
        <div className="text-center py-2">
          <div className="text-2xl font-semibold text-primary">{successRate}%</div>
          <div className="text-xs text-muted-foreground">Success Rate</div>
        </div>

        {/* Status Breakdown */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="h-3 w-3 text-emerald-600" />
              </div>
              <span className="text-sm text-foreground">Completed</span>
            </div>
            <span className="text-sm font-medium text-foreground">{completed}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                <X className="h-3 w-3 text-red-600" />
              </div>
              <span className="text-sm text-foreground">Failed</span>
            </div>
            <span className="text-sm font-medium text-foreground">{failed}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                <Play className="h-3 w-3 text-amber-600" />
              </div>
              <span className="text-sm text-foreground">Running</span>
            </div>
            <span className="text-sm font-medium text-foreground">{running}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-3 w-3 text-blue-600" />
              </div>
              <span className="text-sm text-foreground">Queued</span>
            </div>
            <span className="text-sm font-medium text-foreground">{queued}</span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        {total > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden flex">
              {completed > 0 && (
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${(completed / total) * 100}%` }}
                />
              )}
              {running > 0 && (
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${(running / total) * 100}%` }}
                />
              )}
              {queued > 0 && (
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${(queued / total) * 100}%` }}
                />
              )}
              {failed > 0 && (
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${(failed / total) * 100}%` }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
