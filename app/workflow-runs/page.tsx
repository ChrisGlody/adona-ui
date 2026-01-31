"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { RunsTable, type WorkflowRun } from "@/components/workflow-runs/runs-table"
import { ExecutionSummary } from "@/components/workflow-runs/execution-summary"
import { RunDetailPanel } from "@/components/workflow-runs/run-detail-panel"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface RunDetails {
  run: {
    id: string
    workflowId: string
    status: string
    input: unknown
    output: unknown
    error: unknown
    createdAt: string
    updatedAt: string
    startedAt: string | null
    endedAt: string | null
  }
  steps: {
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
  }[]
}

interface WorkflowData {
  name?: string
  definition?: {
    nodes?: { id: string; name?: string; x?: number; y?: number; type?: string }[]
    edges?: { id: string; source: string; target: string }[]
  }
}

export default function WorkflowRunsPage() {
  const [loading, setLoading] = useState(true)
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null)
  const [runDetails, setRunDetails] = useState<RunDetails | null>(null)
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const secRes = await fetch("/api/secure")
        if (!secRes.ok) {
          if (mounted) router.replace("/login")
          return
        }

        const res = await fetch("/api/workflow-runs")
        if (!res.ok) {
          const data = await res.json()
          if (mounted) setError(data?.error ?? "Failed to load runs")
          return
        }
        const data = await res.json()
        if (mounted) setRuns(data.runs ?? [])
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load runs")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [router])

  // Fetch run details when a run is selected
  const handleSelectRun = async (run: WorkflowRun) => {
    if (selectedRun?.id === run.id) {
      // Deselect if clicking the same run
      setSelectedRun(null)
      setRunDetails(null)
      setWorkflow(null)
      return
    }

    setSelectedRun(run)
    setLoadingDetails(true)
    setRunDetails(null)
    setWorkflow(null)

    try {
      // Fetch run details and workflow in parallel
      const [runRes, wfRes] = await Promise.all([
        fetch(`/api/workflows/runs/${run.id}`),
        fetch(`/api/workflows/${run.workflowId}`),
      ])

      if (runRes.ok) {
        const data = await runRes.json()
        setRunDetails(data)
      }

      if (wfRes.ok) {
        const data = await wfRes.json()
        setWorkflow(data)
      }
    } catch (err) {
      console.error("Error fetching run details:", err)
    } finally {
      setLoadingDetails(false)
    }
  }

  // Calculate summary stats
  const stats = {
    total: runs.length,
    completed: runs.filter(r => r.status === "completed").length,
    failed: runs.filter(r => r.status === "failed").length,
    running: runs.filter(r => r.status === "running").length,
    queued: runs.filter(r => r.status === "queued").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MainNav />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading runs..." />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/90 to-accent/90 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">Workflow Runs</h1>
          <p className="text-primary-foreground/70 max-w-2xl">
            Review detailed execution data for your <strong className="text-primary-foreground">AI-powered</strong> workflows. Click on a run to see the workflow graph and step details.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_280px] gap-6 mb-6">
          <RunsTable
            runs={runs}
            selectedRunId={selectedRun?.id}
            onSelectRun={handleSelectRun}
          />
          <ExecutionSummary
            total={stats.total}
            completed={stats.completed}
            failed={stats.failed}
            running={stats.running}
            queued={stats.queued}
          />
        </div>

        {/* Run Detail Panel */}
        {selectedRun && (
          <div className="mt-6">
            {loadingDetails ? (
              <div className="bg-white rounded-xl border border-border p-8 flex items-center justify-center">
                <LoadingSpinner size="md" text="Loading run details..." />
              </div>
            ) : runDetails ? (
              <RunDetailPanel
                run={{
                  ...runDetails.run,
                  workflowName: selectedRun.workflowName,
                }}
                steps={runDetails.steps}
                workflow={workflow}
                onClose={() => {
                  setSelectedRun(null)
                  setRunDetails(null)
                  setWorkflow(null)
                }}
              />
            ) : (
              <div className="bg-white rounded-xl border border-border p-8 text-center text-muted-foreground">
                Failed to load run details
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
