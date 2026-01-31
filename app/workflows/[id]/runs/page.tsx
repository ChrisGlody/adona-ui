"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MainNav } from "@/components/main-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";

export default function WorkflowRunsPage() {
  const params = useParams<{ id: string }>();
  const workflowId = params?.id as string;
  const [runId, setRunId] = useState<string | null>(null);
  const [runData, setRunData] = useState<{ run: { status: string }; steps: { stepId: string; status: string }[] } | null>(null);
  const [starting, setStarting] = useState(false);
  const [workflow, setWorkflow] = useState<{ definition?: { nodes?: { id: string; name?: string; x?: number; y?: number }[]; edges?: { id: string; source: string; target: string }[] }; inputSchema?: { type?: string; properties?: Record<string, { type?: string; default?: unknown; description?: string }>; required?: string[] } } | null>(null);
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
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setWorkflow(data);
        const def = data?.definition ?? {};
        let wfSchema = def?.inputSchema ?? null;
        if (!wfSchema && Array.isArray(def?.nodes) && Array.isArray(def?.edges)) {
          const targets = new Set(def.edges.map((e: { target: string }) => e.target));
          const startNodes = def.nodes.filter((n: { id: string }) => !targets.has(n.id));
          const candidate = startNodes.length === 1 ? startNodes[0] : def.nodes.length === 1 ? def.nodes[0] : null;
          if (candidate?.inputSchema) wfSchema = candidate.inputSchema;
        }
        setSchema(wfSchema);
        if (wfSchema?.type === "object" && wfSchema?.properties) {
          const initial: Record<string, unknown> = {};
          for (const [key, prop] of Object.entries(wfSchema.properties)) {
            const p = prop as { default?: unknown; type?: string };
            if (p?.default !== undefined) initial[key] = p.default;
            else if (p?.type === "number") initial[key] = 0;
            else if (p?.type === "boolean") initial[key] = false;
            else initial[key] = "";
          }
          setFormValues(initial);
          setRawJson(JSON.stringify(initial, null, 2));
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [workflowId]);

  function renderField(key: string, prop: { type?: string; description?: string }) {
    const isRequired = schema?.required?.includes(key);
    const label = (
      <div className="text-sm font-medium text-foreground">
        {key}
        {isRequired ? <span className="text-destructive">*</span> : null}
      </div>
    );
    const help = prop?.description ? <div className="text-xs text-muted-foreground">{prop.description}</div> : null;
    if (prop?.type === "number") {
      return (
        <div key={key} className="space-y-1">
          {label}
          <Input
            type="number"
            value={(formValues[key] as number) ?? ""}
            onChange={(e) => setFormValues((v) => ({ ...v, [key]: Number(e.target.value) }))}
            className="bg-background border-border"
          />
          {help}
        </div>
      );
    }
    if (prop?.type === "boolean") {
      return (
        <div key={key} className="space-y-1">
          {label}
          <select
            className="border border-border rounded px-2 py-1 h-9 bg-background text-foreground"
            value={String(formValues[key] ?? false)}
            onChange={(e) => setFormValues((v) => ({ ...v, [key]: e.target.value === "true" }))}
          >
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
          {help}
        </div>
      );
    }
    if (prop?.type === "object") {
      return (
        <div key={key} className="space-y-1">
          {label}
          <Textarea
            value={
              typeof formValues[key] === "string"
                ? (formValues[key] as string)
                : JSON.stringify(formValues[key] ?? {}, null, 2)
            }
            onChange={(e) => {
              try {
                setFormValues((v) => ({ ...v, [key]: JSON.parse(e.target.value || "{}") }));
              } catch {
                setFormValues((v) => ({ ...v, [key]: e.target.value }));
              }
            }}
            className="font-mono bg-background border-border"
            rows={6}
          />
          {help}
        </div>
      );
    }
    return (
      <div key={key} className="space-y-1">
        {label}
        <Input
          value={(formValues[key] as string) ?? ""}
          onChange={(e) => setFormValues((v) => ({ ...v, [key]: e.target.value }))}
          className="bg-background border-border"
        />
        {help}
      </div>
    );
  }

  async function startRun() {
    setStarting(true);
    setSubmitError(null);
    let input: unknown = formValues;
    if (!schema) {
      try {
        input = rawJson ? JSON.parse(rawJson) : {};
      } catch {
        setSubmitError("Invalid JSON input");
        setStarting(false);
        return;
      }
    }
    const res = await fetch("/api/workflows/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId, input }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSubmitError((data?.error ?? data?.message) ?? "Failed to start run");
      setStarting(false);
      return;
    }
    setRunId(data.runId);
    setStarting(false);
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />
      <div className="p-6 space-y-4 container mx-auto">
        <Link href="/workflows" className="text-muted-foreground hover:text-foreground">
          Back to Workflows
        </Link>
        <Card className="p-4 space-y-3 bg-card border-border">
          <div className="font-medium text-foreground">Workflow Input</div>
          {schema?.type === "object" && schema?.properties ? (
            <div className="grid gap-3">
              {Object.entries(schema.properties).map(([key, prop]) =>
                renderField(key, prop as { type?: string; description?: string })
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Enter JSON input (no schema defined)</div>
              <Textarea
                className="font-mono bg-background border-border"
                rows={8}
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
              />
            </div>
          )}
          {submitError && <div className="text-sm text-destructive">{submitError}</div>}
          <Button onClick={startRun} disabled={starting}>
            {starting ? "Starting..." : "Start Run"}
          </Button>
        </Card>
        {runId && <div className="text-sm text-muted-foreground">Run: {runId}</div>}
        {runData && (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-7">
              <Card className="h-[60vh] bg-card border-border">
                <ReactFlow nodes={flowNodes} edges={flowEdges} fitView>
                  <MiniMap />
                  <Controls />
                  <Background />
                </ReactFlow>
              </Card>
            </div>
            <div className="col-span-5">
              <Card className="p-4 h-[60vh] overflow-auto bg-card border-border">
                <div className="font-medium text-foreground">Status: {runData.run.status}</div>
                <pre className="mt-2 text-xs bg-muted p-3 rounded text-foreground">
                  {JSON.stringify(runData, null, 2)}
                </pre>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
