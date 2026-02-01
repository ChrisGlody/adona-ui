"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Wrench, Save, Sparkles } from "lucide-react";
import { MainNav } from "@/components/main-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Editor from "@monaco-editor/react";
import { VersionHistoryPanel, VersionCompareModal, RestoreConfirmModal } from "@/components/versioning";

interface Tool {
  id: string;
  name: string;
  description: string | null;
  type: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown> | null;
  implementation: string | null;
  currentVersion?: number;
}

export default function EditToolPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;

  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [inputSchema, setInputSchema] = useState("{}");
  const [outputSchema, setOutputSchema] = useState("{}");

  // Version history state
  const [compareVersions, setCompareVersions] = useState<{ a: number; b: number } | null>(null);
  const [restoreVersion, setRestoreVersion] = useState<number | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/tools/${id}`);
        if (!res.ok) {
          if (res.status === 401) router.replace("/login");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setTool(data);
        setName(data.name || "");
        setDescription(data.description || "");
        setCode(data.implementation || "");
        setInputSchema(JSON.stringify(data.inputSchema || {}, null, 2));
        setOutputSchema(JSON.stringify(data.outputSchema || {}, null, 2));
      } catch {
        setError("Failed to load tool");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Tool name is required");
      return;
    }

    let parsedInputSchema, parsedOutputSchema;
    try {
      parsedInputSchema = JSON.parse(inputSchema);
    } catch {
      setError("Invalid input schema JSON");
      return;
    }
    try {
      parsedOutputSchema = JSON.parse(outputSchema);
    } catch {
      setError("Invalid output schema JSON");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: name.trim(),
          description: description.trim() || null,
          type: tool?.type || "db",
          inputSchema: parsedInputSchema,
          outputSchema: parsedOutputSchema,
          code,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save tool");
      }

      const data = await res.json();
      // Update tool with new version
      setTool((prev) => prev ? { ...prev, currentVersion: data.version } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save tool");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MainNav />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading tool..." />
        </div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MainNav />
        <div className="p-6">
          <p className="text-muted-foreground">Tool not found.</p>
          <Link href="/tools" className="text-primary underline mt-2 inline-block">
            Back to Tools
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />

      <div className="flex-1 flex">
        {/* Icon sidebar */}
        <aside className="w-14 bg-muted border-r border-border flex flex-col items-center py-4 gap-1">
          <Link
            href="/tools"
            className="p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Back to Tools"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1" />
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wrench className="h-4 w-4 text-primary" />
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 border-b border-border px-4 flex items-center justify-between gap-4 bg-card">
            <div className="flex items-center gap-4">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="max-w-xs h-9 bg-background border-border font-medium"
                placeholder="Tool name"
              />
              <span className="text-sm text-muted-foreground">
                v{tool.currentVersion ?? 1}
              </span>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </header>

          {/* Content */}
          <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0">
            {/* Left panel - Editor */}
            <div className="col-span-8 flex flex-col gap-4 overflow-y-auto">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  {error}
                </div>
              )}

              <Card className="p-4 space-y-4 bg-card border-border">
                <div>
                  <Label className="text-sm text-foreground">Description</Label>
                  <Textarea
                    className="mt-1 bg-background border-border"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this tool do?"
                    rows={2}
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground">Implementation Code</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Write an async function that receives input and returns a result.
                  </p>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Editor
                      height={300}
                      defaultLanguage="typescript"
                      value={code}
                      onChange={(v) => setCode(v || "")}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        scrollBeyondLastLine: false,
                      }}
                      theme="vs-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-foreground">Input Schema (JSON)</Label>
                    <div className="mt-1 border border-border rounded-lg overflow-hidden">
                      <Editor
                        height={180}
                        defaultLanguage="json"
                        value={inputSchema}
                        onChange={(v) => setInputSchema(v || "{}")}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 12,
                          scrollBeyondLastLine: false,
                        }}
                        theme="vs-dark"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-foreground">Output Schema (JSON)</Label>
                    <div className="mt-1 border border-border rounded-lg overflow-hidden">
                      <Editor
                        height={180}
                        defaultLanguage="json"
                        value={outputSchema}
                        onChange={(v) => setOutputSchema(v || "{}")}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 12,
                          scrollBeyondLastLine: false,
                        }}
                        theme="vs-dark"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right panel - Version History */}
            <div className="col-span-4 flex flex-col gap-4 overflow-y-auto">
              <VersionHistoryPanel
                entityType="tool"
                entityId={id}
                currentVersion={tool.currentVersion ?? 1}
                onRestore={(v) => setRestoreVersion(v)}
                onCompare={(a, b) => setCompareVersions({ a, b })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Version Compare Modal */}
      {compareVersions && (
        <VersionCompareModal
          open={!!compareVersions}
          onClose={() => setCompareVersions(null)}
          entityType="tool"
          entityId={id}
          versionA={compareVersions.a}
          versionB={compareVersions.b}
        />
      )}

      {/* Restore Version Modal */}
      {restoreVersion !== null && (
        <RestoreConfirmModal
          open={restoreVersion !== null}
          onClose={() => setRestoreVersion(null)}
          onConfirm={async (message) => {
            setRestoring(true);
            try {
              await fetch(`/api/tools/${id}/versions/${restoreVersion}/restore`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ changeMessage: message }),
              });
              // Reload the page to get the restored version
              window.location.reload();
            } catch (error) {
              console.error("Error restoring version:", error);
              setRestoring(false);
            }
          }}
          version={restoreVersion}
          entityType="tool"
          restoring={restoring}
        />
      )}
    </div>
  );
}
