"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MainNav } from "@/components/main-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";

export default function WorkflowRunsPage() {
  const params = useParams<{ id: string }>();
  const workflowId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [runId, setRunId] = useState<string | null>(null);
  const [runData, setRunData] = useState<{ run: { status: string; output?: unknown }; steps: { stepId: string; status: string; output?: unknown }[] } | null>(null);
  const [starting, setStarting] = useState(false);
  const [workflow, setWorkflow] = useState<{ name?: string; executionEnv?: string; definition?: { nodes?: { id: string; name?: string; x?: number; y?: number }[]; edges?: { id: string; source: string; target: string }[] }; inputSchema?: { type?: string; properties?: Record<string, { type?: string; default?: unknown; description?: string }>; required?: string[] } } | null>(null);
  const [schema, setSchema] = useState<{ type?: string; properties?: Record<string, { type?: string; default?: unknown; description?: string }>; required?: string[] } | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [rawJson, setRawJson] = useState<string>("{}");
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!workflowId) return;
      try {
        const res = await fetch(`/api/workflows/${workflowId}`);
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        setWorkflow(data);

        // Check for inputSchema at the workflow level first (correct location)
        let wfSchema = data?.inputSchema ?? null;

        // Fallback: check inside definition or first node
        if (!wfSchema) {
          const def = data?.definition ?? {};
          if (def?.inputSchema) {
            wfSchema = def.inputSchema;
          } else if (Array.isArray(def?.nodes) && Array.isArray(def?.edges)) {
            const targets = new Set(def.edges.map((e: { target: string }) => e.target));
            const startNodes = def.nodes.filter((n: { id: string }) => !targets.has(n.id));
            const candidate = startNodes.length === 1 ? startNodes[0] : def.nodes.length === 1 ? def.nodes[0] : null;
            if (candidate?.inputSchema) wfSchema = candidate.inputSchema;
          }
        }

        setSchema(wfSchema);
        if (wfSchema?.type === "object" && wfSchema?.properties) {
          const initial: Record<string, unknown> = {};
          for (const [key, prop] of Object.entries(wfSchema.properties)) {
            const p = prop as { default?: unknown; type?: string };
            if (p?.default !== undefined) initial[key] = p.default;
            else if (p?.type === "number") initial[key] = 0;
            else if (p?.type === "boolean") initial[key] = false;
            else if (p?.type === "array") initial[key] = [];
            else initial[key] = "";
          }
          setFormValues(initial);
          setRawJson(JSON.stringify(initial, null, 2));
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [workflowId]);

  function renderField(key: string, prop: { type?: string; description?: string; enum?: string[] }) {
    const isRequired = schema?.required?.includes(key);

    // Handle enum (dropdown)
    if (prop?.enum && Array.isArray(prop.enum)) {
      return (
        <div key={key} className="space-y-2">
          <Label className="text-foreground">
            {key}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <select
            className="w-full border border-border rounded-md px-3 h-10 bg-background text-foreground"
            value={(formValues[key] as string) ?? ""}
            onChange={(e) => setFormValues((v) => ({ ...v, [key]: e.target.value }))}
          >
            <option value="">Select {key}...</option>
            {prop.enum.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {prop?.description && <p className="text-xs text-muted-foreground">{prop.description}</p>}
        </div>
      );
    }

    // Handle number
    if (prop?.type === "number" || prop?.type === "integer") {
      return (
        <div key={key} className="space-y-2">
          <Label className="text-foreground">
            {key}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            type="number"
            value={(formValues[key] as number) ?? ""}
            onChange={(e) => setFormValues((v) => ({ ...v, [key]: e.target.value === "" ? "" : Number(e.target.value) }))}
            placeholder={`Enter ${key}`}
            className="bg-background border-border"
          />
          {prop?.description && <p className="text-xs text-muted-foreground">{prop.description}</p>}
        </div>
      );
    }

    // Handle boolean
    if (prop?.type === "boolean") {
      return (
        <div key={key} className="space-y-2">
          <Label className="text-foreground">
            {key}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <select
            className="w-full border border-border rounded-md px-3 h-10 bg-background text-foreground"
            value={String(formValues[key] ?? false)}
            onChange={(e) => setFormValues((v) => ({ ...v, [key]: e.target.value === "true" }))}
          >
            <option value="false">False</option>
            <option value="true">True</option>
          </select>
          {prop?.description && <p className="text-xs text-muted-foreground">{prop.description}</p>}
        </div>
      );
    }

    // Handle object or array (JSON input)
    if (prop?.type === "object" || prop?.type === "array") {
      return (
        <div key={key} className="space-y-2">
          <Label className="text-foreground">
            {key}
            {isRequired && <span className="text-destructive ml-1">*</span>}
            <span className="text-xs text-muted-foreground ml-2">({prop.type})</span>
          </Label>
          <Textarea
            value={
              typeof formValues[key] === "string"
                ? (formValues[key] as string)
                : JSON.stringify(formValues[key] ?? (prop.type === "array" ? [] : {}), null, 2)
            }
            onChange={(e) => {
              try {
                setFormValues((v) => ({ ...v, [key]: JSON.parse(e.target.value || (prop.type === "array" ? "[]" : "{}")) }));
              } catch {
                setFormValues((v) => ({ ...v, [key]: e.target.value }));
              }
            }}
            placeholder={prop.type === "array" ? '["item1", "item2"]' : '{"key": "value"}'}
            className="font-mono text-sm bg-background border-border"
            rows={4}
          />
          {prop?.description && <p className="text-xs text-muted-foreground">{prop.description}</p>}
        </div>
      );
    }

    // Default: string input
    return (
      <div key={key} className="space-y-2">
        <Label className="text-foreground">
          {key}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          value={(formValues[key] as string) ?? ""}
          onChange={(e) => setFormValues((v) => ({ ...v, [key]: e.target.value }))}
          placeholder={prop?.description || `Enter ${key}`}
          className="bg-background border-border"
        />
        {prop?.description && <p className="text-xs text-muted-foreground">{prop.description}</p>}
      </div>
    );
  }

  async function startRun() {
    setStarting(true);
    setSubmitError(null);
    setRunData(null);

    let input: unknown = formValues;
    const schemaHasProperties = schema?.type === "object" && schema?.properties && Object.keys(schema.properties).length > 0;
    if (!schemaHasProperties) {
      try {
        input = rawJson ? JSON.parse(rawJson) : {};
      } catch {
        setSubmitError("Invalid JSON input");
        setStarting(false);
        return;
      }
    }

    try {
      // Check if this is an AI workflow (executionEnv = "db")
      const isAIWorkflow = workflow?.executionEnv === "db" || !workflow?.executionEnv;

      if (isAIWorkflow) {
        // Use AI workflow execution flow
        const runRes = await fetch("/api/ai/workflows/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workflowId, input }),
        });
        const runData = await runRes.json();

        if (!runRes.ok) {
          setSubmitError(runData?.error ?? "Failed to start run");
          setStarting(false);
          return;
        }

        setRunId(runData.runId);

        // Execute steps automatically
        let currentSteps = runData.nextSteps ?? [];
        let isComplete = runData.isComplete ?? false;
        const stepOutputs: Record<string, unknown> = {};

        while (currentSteps.length > 0 && !isComplete) {
          // Execute each available step
          for (const step of currentSteps) {
            // Determine input for this step - use previous step output if there's a dependency
            const def = workflow?.definition ?? {};
            const edges = Array.isArray(def.edges) ? def.edges : [];
            const incomingEdges = edges.filter((e: { target: string }) => e.target === step.stepId);

            // If there are incoming edges, use the output from the source step(s)
            let stepInput: unknown = input;
            if (incomingEdges.length === 1) {
              const sourceStepId = (incomingEdges[0] as { source: string }).source;
              if (stepOutputs[sourceStepId]) {
                stepInput = stepOutputs[sourceStepId];
              }
            } else if (incomingEdges.length > 1) {
              // Multiple dependencies - merge their outputs
              const merged: Record<string, unknown> = {};
              for (const edge of incomingEdges) {
                const sourceId = (edge as { source: string }).source;
                if (stepOutputs[sourceId]) {
                  Object.assign(merged, stepOutputs[sourceId]);
                }
              }
              stepInput = Object.keys(merged).length > 0 ? merged : input;
            }

            const executeRes = await fetch(
              `/api/ai/workflows/${runData.runId}/step/${step.stepId}/execute`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ input: stepInput }),
              }
            );
            const executeData = await executeRes.json();

            if (!executeRes.ok) {
              setSubmitError(`Step ${step.name || step.stepId} failed: ${executeData?.error}`);
              setStarting(false);
              return;
            }

            // Store this step's output for subsequent steps
            if (executeData.output) {
              stepOutputs[step.stepId] = executeData.output;
            }

            currentSteps = executeData.nextSteps ?? [];
            isComplete = executeData.isComplete ?? false;

            if (isComplete) break;
          }
        }
      } else {
        // Use regular workflow run (for S3/Lambda execution)
        const res = await fetch("/api/workflows/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workflowId, input }),
        });
        const data = await res.json();

        if (!res.ok) {
          setSubmitError(data?.error ?? data?.message ?? "Failed to start run");
          setStarting(false);
          return;
        }

        setRunId(data.runId);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to run workflow");
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    if (!runId) return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/workflows/runs/${runId}`);
      if (!res.ok) return;
      const data = await res.json();
      setRunData(data);
    }, 1500);
    return () => clearInterval(t);
  }, [runId]);

  const statusByStepId = useMemo(() => {
    const map: Record<string, string> = {};
    const steps = runData?.steps ?? [];
    for (const s of steps) map[s.stepId] = s.status;
    return map;
  }, [runData]);

  const flowNodes = useMemo(() => {
    const def = workflow?.definition ?? {};
    const nodes = Array.isArray(def.nodes) ? def.nodes : [];
    return nodes.map((n: { id: string; name?: string; x?: number; y?: number }) => {
      const status = statusByStepId[n.id] ?? "pending";
      const color =
        status === "completed"
          ? "#22c55e"
          : status === "running"
            ? "#f59e0b"
            : status === "queued"
              ? "#3b82f6"
              : status === "failed"
                ? "#ef4444"
                : status === "cancelled"
                  ? "#6b7280"
                  : "#9ca3af";
      return {
        id: n.id,
        data: { label: `${n.name ?? n.id} (${status})` },
        position: { x: n.x ?? 0, y: n.y ?? 0 },
        style: { backgroundColor: color + "20", border: `2px solid ${color}`, color: "#111827" },
      };
    });
  }, [workflow, statusByStepId]);

  const flowEdges = useMemo(() => {
    const def = workflow?.definition ?? {};
    const edges = Array.isArray(def.edges) ? def.edges : [];
    return edges.map((e: { id: string; source: string; target: string }) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    }));
  }, [workflow]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MainNav />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading workflow..." />
        </div>
      </div>
    );
  }

  const hasSchema = schema?.type === "object" && schema?.properties && Object.keys(schema.properties).length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />
      <div className="p-6 space-y-6 container mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/workflows" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to Workflows
            </Link>
            <h1 className="text-2xl font-bold text-foreground mt-2">{workflow?.name || "Workflow"} Run</h1>
          </div>
        </div>

        <Card className="p-6 bg-card border-border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Input Parameters</h2>
              {hasSchema && (
                <span className="text-xs text-muted-foreground">
                  {Object.keys(schema.properties!).length} field(s)
                </span>
              )}
            </div>

            {hasSchema ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(schema.properties!).map(([key, prop]) =>
                  renderField(key, prop as { type?: string; description?: string; enum?: string[] })
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  No input schema defined. Enter raw JSON input:
                </p>
                <Textarea
                  className="font-mono text-sm bg-background border-border"
                  rows={8}
                  value={rawJson}
                  onChange={(e) => setRawJson(e.target.value)}
                  placeholder='{"key": "value"}'
                />
              </div>
            )}

            {submitError && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
                {submitError}
              </div>
            )}

            <Button onClick={startRun} disabled={starting} className="w-full sm:w-auto">
              {starting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Starting Run...
                </>
              ) : (
                "Start Run"
              )}
            </Button>
          </div>
        </Card>

        {runId && (
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
            Run ID: <code className="font-mono">{runId}</code>
          </div>
        )}

        {runData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">
              <Card className="h-[60vh] bg-card border-border overflow-hidden">
                <ReactFlow nodes={flowNodes} edges={flowEdges} fitView>
                  <MiniMap />
                  <Controls />
                  <Background />
                </ReactFlow>
              </Card>
            </div>
            <div className="lg:col-span-5">
              <Card className="p-4 h-[60vh] overflow-auto bg-card border-border">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Status</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      runData.run.status === "completed" ? "bg-green-500/20 text-green-600" :
                      runData.run.status === "running" ? "bg-amber-500/20 text-amber-600" :
                      runData.run.status === "failed" ? "bg-red-500/20 text-red-600" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {runData.run.status}
                    </span>
                  </div>

                  {runData.steps.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-medium text-foreground text-sm">Steps</span>
                      <div className="space-y-1">
                        {runData.steps.map((step) => (
                          <div key={step.stepId} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                            <span className="font-mono text-xs">{step.stepId}</span>
                            <span className={`text-xs ${
                              step.status === "completed" ? "text-green-600" :
                              step.status === "running" ? "text-amber-600" :
                              step.status === "failed" ? "text-red-600" :
                              "text-muted-foreground"
                            }`}>
                              {step.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="font-medium text-foreground text-sm">Raw Data</span>
                    <pre className="text-xs bg-muted p-3 rounded text-foreground overflow-auto max-h-64">
                      {JSON.stringify(runData, null, 2)}
                    </pre>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
