"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Tool {
  id: string;
  name: string;
  description: string | null;
  type: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown> | null;
  implementation: string | null;
  lambdaArn?: string | null;
  owner?: string | null;
  createdAt: string;
}

export default function ToolsPage() {
  const [loading, setLoading] = useState(true);
  const [registeringTool, setRegisteringTool] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [runningTool, setRunningTool] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [toolInputs, setToolInputs] = useState<Record<string, unknown>>({});
  const [runOutput, setRunOutput] = useState<unknown>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [toolDefinition, setToolDefinition] = useState(`{
  "name": "multiply_numbers",
  "description": "Multiplies two numbers together and returns the product.",
  "type": "s3-inline",
  "inputSchema": {
    "type": "object",
    "properties": {
      "x": { "type": "number" },
      "y": { "type": "number" }
    },
    "required": ["x", "y"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "result": { "type": "number" }
    }
  },
  "code": "export async function main({ x, y }) { return { result: x * y }; }"
}`);
  const [fetchingTools, setFetchingTools] = useState(false);
  const router = useRouter();

  const fetchTools = async () => {
    setFetchingTools(true);
    try {
      const res = await fetch("/api/tools/list");
      const data = await res.json();
      if (data.tools) setTools(data.tools);
    } catch (error) {
      console.error("Error fetching tools:", error);
    } finally {
      setFetchingTools(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/secure");
        if (!res.ok) {
          if (mounted) router.replace("/login");
          return;
        }
        const data = await res.json();
        if (mounted) setUsername(data.user?.email ?? data.user?.sub ?? "mock user");
        if (mounted) await fetchTools();
      } catch {
        if (mounted) router.replace("/login");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleRegisterTool() {
    setRegisteringTool(true);
    try {
      const toolData = JSON.parse(toolDefinition);
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toolData),
      });
      await res.json();
      await fetchTools();
    } catch (err) {
      console.error("Error registering tool:", err);
    } finally {
      setRegisteringTool(false);
    }
  }

  async function handleRunTool() {
    if (!selectedTool) return;
    setRunningTool(true);
    setRunOutput(null);
    setRunError(null);
    try {
      const res = await fetch("/api/tools/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: selectedTool.id, input: toolInputs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data?.error ?? data?.message) ?? "Failed to run tool");
      setRunOutput(data);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Error running tool");
    } finally {
      setRunningTool(false);
    }
  }

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(tools.find((t) => t.id === toolId) ?? null);
    setToolInputs({});
  };

  const handleInputChange = (key: string, value: unknown) => {
    setToolInputs((prev) => ({ ...prev, [key]: value }));
  };

  const renderInputField = (key: string, schema: { type?: string }) => {
    const isRequired = (selectedTool?.inputSchema as { required?: string[] })?.required?.includes(key);
    if (schema.type === "number") {
      return (
        <div key={key} className="space-y-1">
          <label className="text-sm font-medium text-foreground">
            {key} {isRequired && <span className="text-destructive">*</span>}
          </label>
          <Input
            type="number"
            value={(toolInputs[key] as number) ?? ""}
            onChange={(e) => handleInputChange(key, parseFloat(e.target.value) || 0)}
            placeholder={`Enter ${key}`}
            className="bg-background border-border"
          />
        </div>
      );
    }
    return (
      <div key={key} className="space-y-1">
        <label className="text-sm font-medium text-foreground">
          {key} {isRequired && <span className="text-destructive">*</span>}
        </label>
        <Input
          type="text"
          value={(toolInputs[key] as string) ?? ""}
          onChange={(e) => handleInputChange(key, e.target.value)}
          placeholder={`Enter ${key}`}
          className="bg-background border-border"
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MainNav />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading tools..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />
      <div className="p-6 space-y-6 container mx-auto">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-bold text-foreground">{username}</span>
          </p>
        </div>
        <Card className="p-4 bg-card border-border">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Register New Tool</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">
                Tool Definition (JSON)
              </label>
              <textarea
                className="w-full h-40 p-3 border border-border rounded-md font-mono text-sm bg-background text-foreground"
                value={toolDefinition}
                onChange={(e) => setToolDefinition(e.target.value)}
                placeholder="Paste your tool definition JSON here..."
              />
            </div>
            <Button onClick={handleRegisterTool} disabled={registeringTool} className="w-full">
              {registeringTool ? "Registering tool..." : "Register Tool"}
            </Button>
          </div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Run Tool</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Select Tool</label>
              <select
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                value={selectedTool?.id ?? ""}
                onChange={(e) => handleToolSelect(e.target.value)}
                disabled={fetchingTools}
              >
                <option value="">Choose a tool...</option>
                {tools.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.name} - {tool.description ?? ""}
                  </option>
                ))}
              </select>
            </div>
            {selectedTool && selectedTool.inputSchema?.properties && (
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Input Parameters</h4>
                <div className="grid gap-3">
                  {Object.entries(selectedTool.inputSchema.properties as Record<string, { type?: string }>).map(
                    ([key, schema]) => renderInputField(key, schema)
                  )}
                </div>
              </div>
            )}
            <Button
              onClick={handleRunTool}
              disabled={runningTool || !selectedTool}
              className="w-full"
            >
              {runningTool ? "Running tool..." : "Run Tool"}
            </Button>
            {(runError || runOutput) && (
              <div className="space-y-2">
                {runError && (
                  <div className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-md p-3">
                    {runError}
                  </div>
                )}
                {runOutput && (
                  <div>
                    <h4 className="font-medium mb-1 text-foreground">Result</h4>
                    <pre className="text-sm p-3 border border-border rounded-md bg-muted text-foreground whitespace-pre-wrap break-words overflow-auto max-h-96">
                      {JSON.stringify(runOutput, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
