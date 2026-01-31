"use client"

import { useState, useMemo } from "react"
import { Workflow, ChevronRight, X, Check, Clock, Play, AlertCircle, Hash, Type, ToggleLeft, List, Braces, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import ReactFlow, { Background, Controls } from "reactflow"
import "reactflow/dist/style.css"

interface RunStep {
  id: string
  runId: string
  stepId: string
  name: string
  type: string
  status: "queued" | "running" | "completed" | "failed" | "skipped"
  input: unknown
  output: unknown
  error: unknown
  startedAt: string | null
  endedAt: string | null
}

interface WorkflowDefinition {
  nodes?: { id: string; name?: string; x?: number; y?: number; type?: string }[]
  edges?: { id: string; source: string; target: string }[]
}

interface RunDetailPanelProps {
  run: {
    id: string
    workflowId: string
    workflowName: string | null
    status: string
    input: unknown
    output: unknown
    error: unknown
    createdAt: string
    startedAt: string | null
    endedAt: string | null
  }
  steps: RunStep[]
  workflow?: {
    name?: string
    definition?: WorkflowDefinition
  } | null
  onClose?: () => void
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleString()
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

function StepStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <Check className="h-4 w-4 text-emerald-600" />
    case "failed":
      return <X className="h-4 w-4 text-red-600" />
    case "running":
      return <Play className="h-4 w-4 text-amber-600" />
    case "queued":
      return <Clock className="h-4 w-4 text-blue-600" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-600" />
  }
}

function getValueType(value: unknown): string {
  if (value === null) return "null"
  if (value === undefined) return "undefined"
  if (Array.isArray(value)) return "array"
  if (typeof value === "object") return "object"
  return typeof value
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case "string":
      return <Type className="h-3.5 w-3.5 text-emerald-500" />
    case "number":
      return <Hash className="h-3.5 w-3.5 text-blue-500" />
    case "boolean":
      return <ToggleLeft className="h-3.5 w-3.5 text-purple-500" />
    case "array":
      return <List className="h-3.5 w-3.5 text-amber-500" />
    case "object":
      return <Braces className="h-3.5 w-3.5 text-rose-500" />
    default:
      return <Braces className="h-3.5 w-3.5 text-gray-400" />
  }
}

function DataValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  const type = getValueType(value)

  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">null</span>
  }

  if (type === "string") {
    const str = value as string
    // Check if it looks like a date
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      try {
        const date = new Date(str)
        if (!isNaN(date.getTime())) {
          return (
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <Calendar className="h-3 w-3" />
              {date.toLocaleString()}
            </span>
          )
        }
      } catch {}
    }
    // Long strings get truncated with expand option
    if (str.length > 100) {
      return (
        <span className="text-emerald-700 break-all">
          &quot;{str.slice(0, 100)}...&quot;
          <span className="text-xs text-muted-foreground ml-1">({str.length} chars)</span>
        </span>
      )
    }
    return <span className="text-emerald-700">&quot;{str}&quot;</span>
  }

  if (type === "number") {
    return <span className="text-blue-600 font-mono">{String(value)}</span>
  }

  if (type === "boolean") {
    return (
      <span className={`font-medium ${value ? "text-emerald-600" : "text-rose-600"}`}>
        {String(value)}
      </span>
    )
  }

  if (type === "array") {
    const arr = value as unknown[]
    if (arr.length === 0) {
      return <span className="text-gray-400">[ ]</span>
    }
    if (depth > 2) {
      return <span className="text-amber-600">[...{arr.length} items]</span>
    }
    return (
      <div className="space-y-1">
        {arr.map((item, i) => (
          <div key={i} className="flex items-start gap-2 pl-4 border-l-2 border-amber-200">
            <span className="text-xs text-muted-foreground font-mono min-w-[20px]">{i}</span>
            <DataValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    )
  }

  if (type === "object") {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj)
    if (keys.length === 0) {
      return <span className="text-gray-400">{"{ }"}</span>
    }
    if (depth > 2) {
      return <span className="text-rose-600">{"{...}"}</span>
    }
    return (
      <div className="space-y-1">
        {keys.map((key) => (
          <div key={key} className="flex items-start gap-2 pl-4 border-l-2 border-rose-200">
            <span className="text-sm font-medium text-foreground min-w-fit">{key}:</span>
            <DataValue value={obj[key]} depth={depth + 1} />
          </div>
        ))}
      </div>
    )
  }

  return <span>{String(value)}</span>
}

function DataDisplay({ data, title }: { data: unknown; title: string }) {
  const [showRaw, setShowRaw] = useState(false)
  const type = getValueType(data)
  const isEmpty = data === null || data === undefined ||
    (type === "object" && Object.keys(data as object).length === 0) ||
    (type === "array" && (data as unknown[]).length === 0)

  if (isEmpty) {
    return (
      <div className="bg-slate-50 rounded-lg border border-border p-4 text-center">
        <p className="text-muted-foreground text-sm">No {title.toLowerCase()} data</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-border">
        <div className="flex items-center gap-2">
          <TypeIcon type={type} />
          <span className="text-sm font-medium text-foreground">{title}</span>
          <span className="text-xs text-muted-foreground">
            {type === "object" && `${Object.keys(data as object).length} fields`}
            {type === "array" && `${(data as unknown[]).length} items`}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRaw(!showRaw)}
          className="text-xs h-7"
        >
          {showRaw ? "Formatted" : "Raw JSON"}
        </Button>
      </div>
      <div className="p-4 max-h-80 overflow-auto">
        {showRaw ? (
          <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <div className="text-sm">
            <DataValue value={data} />
          </div>
        )}
      </div>
    </div>
  )
}

export function RunDetailPanel({ run, steps, workflow, onClose }: RunDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<"input" | "output" | "steps" | "graph">("graph")

  const statusByStepId = useMemo(() => {
    const map: Record<string, string> = {}
    for (const s of steps) map[s.stepId] = s.status
    return map
  }, [steps])

  const flowNodes = useMemo(() => {
    const def = workflow?.definition ?? {}
    const nodes = Array.isArray(def.nodes) ? def.nodes : []
    return nodes.map((n, i) => {
      const status = statusByStepId[n.id] ?? "pending"
      const color =
        status === "completed" ? "#22c55e" :
        status === "running" ? "#f59e0b" :
        status === "queued" ? "#3b82f6" :
        status === "failed" ? "#ef4444" :
        "#9ca3af"
      return {
        id: n.id,
        data: { label: n.name ?? n.id },
        position: { x: n.x ?? 100, y: n.y ?? (i * 100) },
        style: {
          backgroundColor: color + "20",
          border: `2px solid ${color}`,
          color: "#111827",
          borderRadius: "8px",
          padding: "10px 16px",
        },
      }
    })
  }, [workflow, statusByStepId])

  const flowEdges = useMemo(() => {
    const def = workflow?.definition ?? {}
    const edges = Array.isArray(def.edges) ? def.edges : []
    return edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: true,
    }))
  }, [workflow])

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-border">
        <div className="flex items-center gap-2 text-sm">
          <Workflow className="h-4 w-4 text-primary" />
          <span className="font-medium">Run</span>
          <span className="font-mono text-primary">{run.id}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">{run.workflowName ?? "Workflow"}</span>
          <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
            run.status === "completed" ? "bg-emerald-100 text-emerald-700" :
            run.status === "failed" ? "bg-red-100 text-red-700" :
            run.status === "running" ? "bg-amber-100 text-amber-700" :
            "bg-blue-100 text-blue-700"
          }`}>
            {run.status}
          </span>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-2 border-b border-border bg-slate-50/50">
        {(["graph", "steps", "input", "output"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "graph" && (
          <div className="h-80 border border-border rounded-lg overflow-hidden">
            {flowNodes.length > 0 ? (
              <ReactFlow nodes={flowNodes} edges={flowEdges} fitView>
                <Background />
                <Controls />
              </ReactFlow>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No workflow graph available
              </div>
            )}
          </div>
        )}

        {activeTab === "steps" && (
          <div className="space-y-2">
            {steps.length === 0 ? (
              <p className="text-muted-foreground text-sm">No steps recorded</p>
            ) : (
              steps.map((step) => (
                <div key={step.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StepStatusIcon status={step.status} />
                      <span className="font-medium text-foreground">{step.name}</span>
                      <span className="text-xs text-muted-foreground">({step.type})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(step.startedAt, step.endedAt)}
                    </span>
                  </div>
                  {step.output && (
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground">Output:</span>
                      <pre className="text-xs bg-slate-50 p-2 rounded mt-1 overflow-auto max-h-32">
                        {JSON.stringify(step.output, null, 2)}
                      </pre>
                    </div>
                  )}
                  {step.error && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                      {typeof step.error === "object" && step.error !== null && "message" in step.error
                        ? String((step.error as { message: string }).message)
                        : JSON.stringify(step.error)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "input" && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Input</h4>
            <pre className="text-xs bg-slate-50 p-3 rounded-lg border border-border overflow-auto max-h-64">
              {JSON.stringify(run.input, null, 2) || "No input"}
            </pre>
          </div>
        )}

        {activeTab === "output" && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Output</h4>
            <pre className="text-xs bg-slate-50 p-3 rounded-lg border border-border overflow-auto max-h-64">
              {JSON.stringify(run.output, null, 2) || "No output"}
            </pre>
            {run.error && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-red-600 mb-2">Error</h4>
                <pre className="text-xs bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 overflow-auto max-h-32">
                  {typeof run.error === "object" && run.error !== null && "message" in run.error
                    ? String((run.error as { message: string }).message)
                    : JSON.stringify(run.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Timing Info */}
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Created</span>
            <p className="font-medium text-foreground">{formatDate(run.createdAt)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Started</span>
            <p className="font-medium text-foreground">{formatDate(run.startedAt)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Duration</span>
            <p className="font-medium text-foreground">{formatDuration(run.startedAt, run.endedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
