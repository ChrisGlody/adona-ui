"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, GitBranch, Play, Sparkles, Plus, Trash2, Eye, EyeOff, Key } from "lucide-react";
import { MainNav } from "@/components/main-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import Editor from "@monaco-editor/react";
import { SchemaEditor, type JsonSchema } from "@/components/workflows/schema-editor";
import { SelectToolModal, type Tool as SelectableTool } from "@/components/tools/select-tool-modal";

type EnvVar = {
  key: string;
  value: string;
  isSecret?: boolean;
};

type WorkflowDef = {
  id: string;
  name: string;
  description?: string | null;
  executionEnv?: string | null;
  inputSchema?: JsonSchema | null;
  outputSchema?: JsonSchema | null;
  envVars?: EnvVar[] | null;
  definition?: { nodes: NodeDef[]; edges: EdgeDef[] };
};

type NodeDef = {
  id: string;
  name?: string;
  type?: string;
  x?: number;
  y?: number;
  toolId?: string;
  url?: string;
  operation?: string;
  queryExpression?: string;
  memoryIdExpression?: string;
  code?: string;
  inputMapping?: string;
  inputSchema?: JsonSchema;
  outputSchema?: JsonSchema;
  // LLM fields
  model?: string;
  systemPrompt?: string;
  userPromptExpression?: string;
  temperature?: number;
  maxTokens?: number;
  // Inference fields (host/port via system env vars)
  promptExpression?: string;
  topP?: number;
  topK?: number;
  seed?: number;
};

type EdgeDef = { id: string; source: string; target: string };

export default function EditWorkflowPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;
  const [wf, setWf] = useState<WorkflowDef | null>(null);
  const [nodes, setNodes] = useState<{ id: string; data: { label: string }; position: { x: number; y: number } }[]>([]);
  const [edges, setEdges] = useState<{ id: string; source: string; target: string }[]>([]);
  const [selectedNode, setSelectedNode] = useState<{ id: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<{ id: string; name: string; description?: string | null; inputSchema?: { properties?: Record<string, unknown> } }[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<number, boolean>>({});
  const [selectToolModalOpen, setSelectToolModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/workflows/${id}`);
        if (!res.ok) {
          if (res.status === 401) router.replace("/login");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setWf(data);
        setNodes(
          (data.definition?.nodes || []).map((n: NodeDef) => ({
            id: n.id,
            data: { label: n.name || n.id },
            position: { x: n.x ?? 0, y: n.y ?? 0 },
          }))
        );
        setEdges(
          (data.definition?.edges || []).map((e: EdgeDef) => ({
            id: e.id,
            source: e.source,
            target: e.target,
          }))
        );
      } catch {
        setLoading(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/tools/list");
        const data = await res.json();
        setTools(data.tools || []);
      } catch {
        // ignore
      }
    })();
  }, []);

  const onConnect = (connection: Connection) =>
    setEdges((eds) => addEdge(connection, eds));
  const onNodesChange = (changes: NodeChange[]) =>
    setNodes((nds) => applyNodeChanges(changes, nds));
  const onEdgesChange = (changes: EdgeChange[]) =>
    setEdges((eds) => applyEdgeChanges(changes, eds));

  const currentNodeDef = useMemo(() => {
    if (!selectedNode || !wf?.definition?.nodes) return null;
    return wf.definition.nodes.find((n) => n.id === selectedNode.id) ?? null;
  }, [selectedNode, wf]);

  function updateNodeDef(patch: Partial<NodeDef>) {
    if (!wf || !currentNodeDef) return;
    const def = { ...(wf.definition || { nodes: [], edges: [] }) };
    def.nodes = def.nodes.map((n) =>
      n.id === currentNodeDef.id ? { ...n, ...patch } : n
    );
    setWf({ ...wf, definition: def });
    if (patch.name) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === currentNodeDef.id ? { ...n, data: { ...n.data, label: patch.name! } } : n
        )
      );
    }
  }

  async function save() {
    if (!wf) return;
    setSaving(true);
    const definition = {
      nodes: nodes.map((n) => ({
        id: n.id,
        name: n.data?.label,
        x: n.position.x,
        y: n.position.y,
        ...(wf.definition?.nodes?.find((d) => d.id === n.id) || {}),
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        ...(wf.definition?.edges?.find((d) => d.id === e.id) || {}),
      })),
    };
    const payload = {
      id,
      name: wf.name || "Workflow",
      description: wf.description,
      executionEnv: wf.executionEnv || "db",
      inputSchema: wf.inputSchema,
      outputSchema: wf.outputSchema,
      envVars: wf.envVars,
      definition,
    };
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json();
      alert(`Save failed: ${err.error || "Unknown error"}`);
    }
  }

  function addNode(type: string, toolId?: string, toolName?: string) {
    const newId = `n_${Math.random().toString(36).slice(2, 8)}`;
    const nodeName = toolName || `${type} ${newId}`;
    setNodes((nds) =>
      nds.concat({
        id: newId,
        data: { label: nodeName },
        position: { x: 100 + Math.random() * 80, y: 100 + Math.random() * 80 },
      })
    );
    const def = { ...(wf?.definition || { nodes: [], edges: [] }) };
    const newNode: NodeDef = { id: newId, name: nodeName, type };
    if (toolId) {
      newNode.toolId = toolId;
    }
    def.nodes = [...(def.nodes || []), newNode];
    if (wf) {
      setWf({ ...wf, definition: def });
    }
  }

  function handleToolSelected(tool: SelectableTool) {
    addNode("tool", tool.id, tool.name);
    setSelectToolModalOpen(false);
  }

  function deleteSelectedNode() {
    if (!selectedNode || !wf) return;
    const nodeId = selectedNode.id;
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    const def = { ...(wf.definition || { nodes: [], edges: [] }) };
    def.nodes = (def.nodes || []).filter((n) => n.id !== nodeId);
    def.edges = (def.edges || []).filter((e) => e.source !== nodeId && e.target !== nodeId);
    setWf({ ...wf, definition: def });
    setSelectedNode(null);
  }

  async function generateFromAI() {
    if (!aiPrompt.trim() || !wf) return;
    setGenerating(true);
    try {
      // Include current workflow state so AI can modify it
      const currentWorkflow = {
        name: wf.name,
        description: wf.description,
        inputSchema: wf.inputSchema,
        outputSchema: wf.outputSchema,
        envVars: wf.envVars,
        definition: {
          nodes: nodes.map((n) => ({
            id: n.id,
            name: n.data?.label,
            x: n.position.x,
            y: n.position.y,
            ...(wf.definition?.nodes?.find((d) => d.id === n.id) || {}),
          })),
          edges: edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            ...(wf.definition?.edges?.find((d) => d.id === e.id) || {}),
          })),
        },
      };

      const res = await fetch("/api/ai/workflows/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          existingWorkflow: currentWorkflow,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Generation failed: ${data.error || "Unknown error"}`);
        return;
      }
      const generated = data.workflow;
      // Update workflow with generated data
      setWf({
        ...wf,
        name: generated.name || wf.name,
        description: generated.description || wf.description,
        inputSchema: generated.inputSchema || wf.inputSchema,
        outputSchema: generated.outputSchema || wf.outputSchema,
        envVars: generated.envVars || wf.envVars,
        definition: generated.definition,
      });
      // Update ReactFlow nodes
      setNodes(
        (generated.definition?.nodes || []).map((n: NodeDef) => ({
          id: n.id,
          data: { label: n.name || n.id },
          position: { x: n.x ?? 100, y: n.y ?? 100 },
        }))
      );
      // Update ReactFlow edges
      setEdges(
        (generated.definition?.edges || []).map((e: EdgeDef) => ({
          id: e.id,
          source: e.source,
          target: e.target,
        }))
      );
      setAiPrompt("");
      setSelectedNode(null);
    } catch (error) {
      alert(`Generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setGenerating(false);
    }
  }

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

  if (!wf) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MainNav />
        <div className="p-6">
          <p className="text-muted-foreground">Workflow not found.</p>
          <Link href="/workflows" className="text-primary underline mt-2 inline-block">
            Back to Workflows
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />

      <div className="flex-1 flex">
        {/* Icon sidebar - Back to Workflows, Runs */}
        <aside className="w-14 bg-muted border-r border-border flex flex-col items-center py-4 gap-1">
          <Link
            href="/workflows"
            className="p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Back to Workflows"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link
            href={`/workflows/${id}/runs`}
            className="p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Runs"
          >
            <Play className="h-5 w-5" />
          </Link>
          <div className="flex-1" />
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <GitBranch className="h-4 w-4 text-primary" />
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header: workflow name + Save */}
          <header className="h-14 border-b border-border px-4 flex items-center justify-between gap-4 bg-card">
            <div className="flex items-center gap-4">
              <Input
                value={wf.name}
                onChange={(e) => setWf({ ...wf, name: e.target.value })}
                className="max-w-xs h-9 bg-background border-border font-medium"
                placeholder="Workflow name"
              />
            </div>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </header>

          {/* Three columns: Left (Palette + Settings) | Canvas | Right (Inspector) */}
          <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0">
            {/* Left panel */}
            <div className="col-span-4 flex flex-col gap-4 overflow-y-auto">
              <Card className="p-3 space-y-3 bg-card border-border">
                <div className="font-medium text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Workflow Generator
                </div>
                <div className="space-y-2">
                  <Textarea
                    className="min-h-[80px] bg-background border-border text-foreground text-sm"
                    placeholder="Describe the workflow you want to create...&#10;&#10;Example: Create a workflow that uses the multiply_numbers tool, then processes the result with an LLM."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    disabled={generating}
                  />
                  {tools.length > 0 && (
                    <div className="p-2 rounded bg-muted/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">
                        Available tools (mention by name in prompt):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {tools.map((t) => (
                          <span
                            key={t.id}
                            className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                            onClick={() => setAiPrompt((p) => p + (p ? " " : "") + `use the "${t.name}" tool`)}
                            title={t.description || "Click to add to prompt"}
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={generateFromAI}
                    disabled={generating || !aiPrompt.trim()}
                  >
                    {generating ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Workflow
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              <Card className="p-3 space-y-2 bg-card border-border">
                <div className="font-medium text-foreground">Palette</div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectToolModalOpen(true)}>
                    Add Tool
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addNode("inline")}>
                    Add Inline Code
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addNode("memory")}>
                    Add Memory
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addNode("llm")}>
                    Add LLM
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addNode("inference")}>
                    Add Deterministic Inference
                  </Button>
                </div>
              </Card>

              <Card className="p-3 space-y-3 bg-card border-border">
                <div className="font-medium text-foreground">Workflow Settings</div>
                <div>
                  <Label className="text-sm text-foreground">Description</Label>
                  <Textarea
                    className="mt-1 w-full min-h-[80px] bg-background border-border text-foreground"
                    value={wf.description ?? ""}
                    onChange={(e) => setWf({ ...wf, description: e.target.value })}
                    placeholder="Describe what this workflow does..."
                  />
                </div>
                <div>
                  <Label className="text-sm text-foreground">Execution Environment</Label>
                  <select
                    className="mt-1 w-full h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm"
                    value={wf.executionEnv ?? "db"}
                    onChange={(e) => setWf({ ...wf, executionEnv: e.target.value })}
                  >
                    <option value="db">Database (AI-driven)</option>
                    <option value="s3">S3 + Lambda (automatic)</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {wf.executionEnv === "s3"
                      ? "Steps run automatically via Lambda orchestration"
                      : "AI agent executes each step individually"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-foreground">Input Schema</Label>
                  <div className="mt-1 rounded border border-border overflow-hidden">
                    <Editor
                      height={100}
                      defaultLanguage="json"
                      value={JSON.stringify(wf.inputSchema ?? { type: "object", properties: {} }, null, 2)}
                      onChange={(v) => {
                        try {
                          setWf({ ...wf, inputSchema: JSON.parse(v ?? "{}") });
                        } catch {
                          // keep current
                        }
                      }}
                      options={{ minimap: { enabled: false } }}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-foreground">Output Schema</Label>
                  <div className="mt-1 rounded border border-border overflow-hidden">
                    <Editor
                      height={100}
                      defaultLanguage="json"
                      value={JSON.stringify(wf.outputSchema ?? { type: "object", properties: {} }, null, 2)}
                      onChange={(v) => {
                        try {
                          setWf({ ...wf, outputSchema: JSON.parse(v ?? "{}") });
                        } catch {
                          // keep current
                        }
                      }}
                      options={{ minimap: { enabled: false } }}
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-3 space-y-3 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-foreground flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" />
                    Environment Variables
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const envVars = [...(wf.envVars || [])];
                      envVars.push({ key: "", value: "", isSecret: false });
                      setWf({ ...wf, envVars });
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Environment variables are available in step code via <code className="bg-muted px-1 rounded">context.env.YOUR_VAR</code>
                </p>
                {(wf.envVars || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No environment variables defined
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(wf.envVars || []).map((envVar, idx) => (
                      <div key={idx} className="flex gap-2 items-start p-2 bg-muted/50 rounded-lg">
                        <div className="flex-1 space-y-2">
                          <Input
                            className="h-8 bg-background border-border font-mono text-sm"
                            placeholder="VARIABLE_NAME"
                            value={envVar.key}
                            onChange={(e) => {
                              const envVars = [...(wf.envVars || [])];
                              envVars[idx] = { ...envVars[idx], key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") };
                              setWf({ ...wf, envVars });
                            }}
                          />
                          <div className="relative">
                            <Input
                              className="h-8 bg-background border-border text-sm pr-8"
                              placeholder="Value"
                              type={envVar.isSecret && !showSecrets[idx] ? "password" : "text"}
                              value={envVar.value}
                              onChange={(e) => {
                                const envVars = [...(wf.envVars || [])];
                                envVars[idx] = { ...envVars[idx], value: e.target.value };
                                setWf({ ...wf, envVars });
                              }}
                            />
                            {envVar.isSecret && (
                              <button
                                type="button"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowSecrets({ ...showSecrets, [idx]: !showSecrets[idx] })}
                              >
                                {showSecrets[idx] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant={envVar.isSecret ? "default" : "outline"}
                            className="h-8 w-8 p-0"
                            title={envVar.isSecret ? "Secret (hidden)" : "Not secret"}
                            onClick={() => {
                              const envVars = [...(wf.envVars || [])];
                              envVars[idx] = { ...envVars[idx], isSecret: !envVars[idx].isSecret };
                              setWf({ ...wf, envVars });
                            }}
                          >
                            <Key className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              const envVars = [...(wf.envVars || [])];
                              envVars.splice(idx, 1);
                              setWf({ ...wf, envVars });
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Center - ReactFlow */}
            <div className="col-span-5 min-h-[400px]">
              <Card className="h-full min-h-[400px] bg-card border-border overflow-hidden">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={(_, n) => setSelectedNode(n)}
                  fitView
                >
                  <MiniMap />
                  <Controls />
                  <Background />
                </ReactFlow>
              </Card>
            </div>

            {/* Right - Inspector */}
            <div className="col-span-3 overflow-y-auto">
              <Card className="p-3 space-y-3 bg-card border-border">
                <div className="font-medium text-foreground">Inspector</div>
                {currentNodeDef ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground font-mono">{currentNodeDef.id}</p>
                    <Button variant="destructive" size="sm" onClick={deleteSelectedNode}>
                      Delete Step
                    </Button>
                    <div>
                      <Label className="text-sm text-foreground">Step Name</Label>
                      <Input
                        className="mt-1 h-9 bg-background border-border"
                        value={currentNodeDef.name ?? ""}
                        onChange={(e) => updateNodeDef({ name: e.target.value })}
                        placeholder="Step name"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-foreground">Type</Label>
                      <select
                        className="mt-1 w-full h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm"
                        value={currentNodeDef.type ?? "tool"}
                        onChange={(e) => updateNodeDef({ type: e.target.value })}
                      >
                        <option value="tool">Tool</option>
                        <option value="inline">Inline</option>
                        <option value="memory">Memory</option>
                        <option value="llm">LLM</option>
                        <option value="inference">Inference</option>
                      </select>
                    </div>

                    {currentNodeDef.type === "tool" && (
                      <div>
                        <Label className="text-sm text-foreground">Tool</Label>
                        <select
                          className="mt-1 w-full h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm"
                          value={currentNodeDef.toolId ?? ""}
                          onChange={(e) => updateNodeDef({ toolId: e.target.value })}
                        >
                          <option value="">Choose a tool…</option>
                          {tools.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} — {t.description ?? ""}
                            </option>
                          ))}
                        </select>
                        {tools.find((t) => t.id === currentNodeDef.toolId) && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Input fields:{" "}
                            {Object.keys(
                              tools.find((t) => t.id === currentNodeDef.toolId)?.inputSchema?.properties ?? {}
                            ).join(", ") || "(none)"}
                          </p>
                        )}
                      </div>
                    )}

                    {currentNodeDef.type === "memory" && (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm text-foreground">Operation</Label>
                          <select
                            className="mt-1 w-full h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm"
                            value={currentNodeDef.operation ?? "search"}
                            onChange={(e) => updateNodeDef({ operation: e.target.value })}
                          >
                            <option value="search">Search Memory</option>
                            <option value="add">Add to Memory</option>
                            <option value="update">Update Memory</option>
                            <option value="delete">Delete Memory</option>
                            <option value="get">Get Memory by ID</option>
                            <option value="getAll">Get All Memories</option>
                            <option value="deleteAll">Delete All Memories</option>
                          </select>
                        </div>

                        {/* Memory ID Expression - for update, delete, get */}
                        {["update", "delete", "get"].includes(currentNodeDef.operation ?? "") && (
                          <div>
                            <Label className="text-sm text-foreground">Memory ID Expression</Label>
                            <div className="mt-1 rounded border border-border overflow-hidden">
                              <Editor
                                height={60}
                                defaultLanguage="javascript"
                                value={currentNodeDef.memoryIdExpression ?? "context.input.memoryId"}
                                onChange={(v) => updateNodeDef({ memoryIdExpression: v ?? "" })}
                                options={{ minimap: { enabled: false } }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Expression to get the memory ID
                            </p>
                          </div>
                        )}

                        {/* Query/Content Expression - for search, add, update */}
                        {["search", "add", "update"].includes(currentNodeDef.operation ?? "search") && (
                          <div>
                            <Label className="text-sm text-foreground">
                              {currentNodeDef.operation === "search" ? "Query Expression" :
                               currentNodeDef.operation === "update" ? "New Content Expression" :
                               "Content Expression"}
                            </Label>
                            <div className="mt-1 rounded border border-border overflow-hidden">
                              <Editor
                                height={100}
                                defaultLanguage="javascript"
                                value={currentNodeDef.queryExpression ?? "context.workflowInput.query"}
                                onChange={(v) => updateNodeDef({ queryExpression: v ?? "" })}
                                options={{ minimap: { enabled: false } }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              JS expression (workflowInput, stepOutputs, input)
                            </p>
                          </div>
                        )}

                        {/* Info for getAll and deleteAll */}
                        {["getAll", "deleteAll"].includes(currentNodeDef.operation ?? "") && (
                          <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                            {currentNodeDef.operation === "getAll"
                              ? "This will retrieve all memories for the current user."
                              : "⚠️ This will delete ALL memories for the current user. Use with caution."}
                          </p>
                        )}
                      </div>
                    )}

                    {currentNodeDef.type === "llm" && (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm text-foreground">Model</Label>
                          <select
                            className="mt-1 w-full h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm"
                            value={currentNodeDef.model ?? "gpt-4o-mini"}
                            onChange={(e) => updateNodeDef({ model: e.target.value })}
                          >
                            <option value="gpt-4o-mini">GPT-4o Mini (fast, cheap)</option>
                            <option value="gpt-4o">GPT-4o (powerful)</option>
                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-sm text-foreground">System Prompt</Label>
                          <div className="mt-1 rounded border border-border overflow-hidden">
                            <Editor
                              height={100}
                              defaultLanguage="markdown"
                              value={currentNodeDef.systemPrompt ?? "You are a helpful assistant."}
                              onChange={(v) => updateNodeDef({ systemPrompt: v ?? "" })}
                              options={{ minimap: { enabled: false }, wordWrap: "on" }}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-foreground">User Prompt Expression</Label>
                          <div className="mt-1 rounded border border-border overflow-hidden">
                            <Editor
                              height={80}
                              defaultLanguage="javascript"
                              value={currentNodeDef.userPromptExpression ?? "input.query || JSON.stringify(input)"}
                              onChange={(v) => updateNodeDef({ userPromptExpression: v ?? "" })}
                              options={{ minimap: { enabled: false } }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            JS expression using: input, workflowInput, stepOutputs, context
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-sm text-foreground">Temperature</Label>
                            <Input
                              type="number"
                              min="0"
                              max="2"
                              step="0.1"
                              className="mt-1 h-9 bg-background border-border"
                              value={currentNodeDef.temperature ?? 0.7}
                              onChange={(e) => updateNodeDef({ temperature: parseFloat(e.target.value) || 0.7 })}
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-foreground">Max Tokens</Label>
                            <Input
                              type="number"
                              min="1"
                              max="4096"
                              className="mt-1 h-9 bg-background border-border"
                              value={currentNodeDef.maxTokens ?? 1000}
                              onChange={(e) => updateNodeDef({ maxTokens: parseInt(e.target.value) || 1000 })}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                          Returns: {"{ response: string, model: string, usage: { promptTokens, completionTokens, totalTokens } }"}
                        </p>
                      </div>
                    )}

                    {currentNodeDef.type === "inference" && (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                          Uses system env vars: INFERENCE_HOST, INFERENCE_PORT
                        </p>
                        <div>
                          <Label className="text-sm text-foreground">Prompt Expression</Label>
                          <div className="mt-1 rounded border border-border overflow-hidden">
                            <Editor
                              height={80}
                              defaultLanguage="javascript"
                              value={currentNodeDef.promptExpression ?? "input.prompt || JSON.stringify(input)"}
                              onChange={(v) => updateNodeDef({ promptExpression: v ?? "" })}
                              options={{ minimap: { enabled: false } }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            JS expression using: input, workflowInput, stepOutputs, context
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-sm text-foreground">Temperature</Label>
                            <Input
                              type="number"
                              min="0"
                              max="2"
                              step="0.1"
                              className="mt-1 h-9 bg-background border-border"
                              value={currentNodeDef.temperature ?? 0}
                              onChange={(e) => updateNodeDef({ temperature: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-foreground">Seed</Label>
                            <Input
                              type="number"
                              className="mt-1 h-9 bg-background border-border"
                              value={currentNodeDef.seed ?? 42}
                              onChange={(e) => updateNodeDef({ seed: parseInt(e.target.value) || 42 })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-sm text-foreground">Top P</Label>
                            <Input
                              type="number"
                              min="0"
                              max="1"
                              step="0.1"
                              className="mt-1 h-9 bg-background border-border"
                              value={currentNodeDef.topP ?? 1.0}
                              onChange={(e) => updateNodeDef({ topP: parseFloat(e.target.value) || 1.0 })}
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-foreground">Top K</Label>
                            <Input
                              type="number"
                              min="0"
                              className="mt-1 h-9 bg-background border-border"
                              value={currentNodeDef.topK ?? 0}
                              onChange={(e) => updateNodeDef({ topK: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                          Calls /generate endpoint. Returns: {"{ output: string, prompt: string, parameters: {...}, endpoint: string }"}
                        </p>
                      </div>
                    )}

                    {currentNodeDef.type === "inline" && (
                      <div>
                        <Label className="text-sm text-foreground">Code (main(input, context))</Label>
                        <div className="mt-1 rounded border border-border overflow-hidden">
                          <Editor
                            height={180}
                            defaultLanguage="typescript"
                            value={
                              currentNodeDef.code ??
                              "export async function main(input, context){return input;}"
                            }
                            onChange={(v) => updateNodeDef({ code: v ?? "" })}
                            options={{ minimap: { enabled: false } }}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm text-foreground">Input Mapping (JS expression)</Label>
                      <div className="mt-1 rounded border border-border overflow-hidden">
                        <Editor
                          height={80}
                          defaultLanguage="javascript"
                          value={currentNodeDef.inputMapping ?? "({})"}
                          onChange={(v) => updateNodeDef({ inputMapping: v ?? "" })}
                          options={{ minimap: { enabled: false } }}
                        />
                      </div>
                    </div>

                    <SchemaEditor
                      title="Input Schema"
                      schema={
                        currentNodeDef.inputSchema ?? {
                          type: "object",
                          properties: {},
                          required: [],
                        }
                      }
                      onChange={(s) => updateNodeDef({ inputSchema: s })}
                    />
                    <SchemaEditor
                      title="Output Schema"
                      schema={
                        currentNodeDef.outputSchema ?? {
                          type: "object",
                          properties: {},
                          required: [],
                        }
                      }
                      onChange={(s) => updateNodeDef({ outputSchema: s })}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Select a node to edit</p>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Select Tool Modal */}
      <SelectToolModal
        open={selectToolModalOpen}
        onClose={() => setSelectToolModalOpen(false)}
        onSelect={handleToolSelected}
      />
    </div>
  );
}
