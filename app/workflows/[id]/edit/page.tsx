"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, GitBranch, Play, Sparkles } from "lucide-react";
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

type WorkflowDef = {
  id: string;
  name: string;
  description?: string | null;
  executionEnv?: string | null;
  inputSchema?: JsonSchema | null;
  outputSchema?: JsonSchema | null;
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
  code?: string;
  inputMapping?: string;
  inputSchema?: JsonSchema;
  outputSchema?: JsonSchema;
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

  function addNode(type: string) {
    const newId = `n_${Math.random().toString(36).slice(2, 8)}`;
    setNodes((nds) =>
      nds.concat({
        id: newId,
        data: { label: `${type} ${newId}` },
        position: { x: 100 + Math.random() * 80, y: 100 + Math.random() * 80 },
      })
    );
    const def = { ...(wf?.definition || { nodes: [], edges: [] }) };
    def.nodes = [...(def.nodes || []), { id: newId, name: `${type} ${newId}`, type }];
    setWf({ ...(wf || {}), definition: def });
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
      const res = await fetch("/api/ai/workflows/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
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
                    placeholder="Describe the workflow you want to create...&#10;&#10;Example: Create a workflow that fetches user data from an API, processes it to extract emails, and saves the results to a database."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    disabled={generating}
                  />
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
                  <Button size="sm" variant="outline" onClick={() => addNode("tool")}>
                    Add Tool
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addNode("inline")}>
                    Add Inline
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addNode("http")}>
                    Add HTTP
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addNode("memory")}>
                    Add Memory
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
                        <option value="http">HTTP</option>
                        <option value="memory">Memory</option>
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

                    {currentNodeDef.type === "http" && (
                      <div>
                        <Label className="text-sm text-foreground">URL</Label>
                        <Input
                          className="mt-1 h-9 bg-background border-border"
                          value={currentNodeDef.url ?? ""}
                          onChange={(e) => updateNodeDef({ url: e.target.value })}
                          placeholder="https://..."
                        />
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
                          </select>
                        </div>
                        <div>
                          <Label className="text-sm text-foreground">Query Expression</Label>
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
    </div>
  );
}
