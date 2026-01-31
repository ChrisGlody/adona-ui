"use client";

import { useState } from "react";
import { X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tool } from "./tools-table";

interface RunToolModalProps {
  open: boolean;
  tool: Tool | null;
  onClose: () => void;
}

export function RunToolModal({ open, tool, onClose }: RunToolModalProps) {
  const [inputs, setInputs] = useState<Record<string, unknown>>({});
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    if (!tool) return;

    setRunning(true);
    setOutput(null);
    setError(null);

    try {
      const res = await fetch("/api/tools/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: tool.id, input: inputs }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to run tool");
      }
      setOutput(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error running tool");
    } finally {
      setRunning(false);
    }
  };

  const handleClose = () => {
    setInputs({});
    setOutput(null);
    setError(null);
    onClose();
  };

  const handleInputChange = (key: string, value: unknown) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  if (!open || !tool) return null;

  const properties = (tool.inputSchema?.properties || {}) as Record<
    string,
    { type?: string; description?: string }
  >;
  const required = (tool.inputSchema as { required?: string[] })?.required || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Run Tool</h2>
            <p className="text-sm text-muted-foreground">{tool.name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {Object.keys(properties).length === 0 ? (
            <p className="text-muted-foreground text-sm">
              This tool has no input parameters.
            </p>
          ) : (
            <div className="space-y-4">
              <Label className="text-sm font-medium">Input Parameters</Label>
              {Object.entries(properties).map(([key, schema]) => {
                const isRequired = required.includes(key);
                return (
                  <div key={key} className="space-y-1">
                    <label className="text-sm font-medium text-foreground">
                      {key} {isRequired && <span className="text-destructive">*</span>}
                    </label>
                    {schema.description && (
                      <p className="text-xs text-muted-foreground">{schema.description}</p>
                    )}
                    <Input
                      type={schema.type === "number" || schema.type === "integer" ? "number" : "text"}
                      value={(inputs[key] as string | number) ?? ""}
                      onChange={(e) => {
                        const val =
                          schema.type === "number" || schema.type === "integer"
                            ? parseFloat(e.target.value) || 0
                            : e.target.value;
                        handleInputChange(key, val);
                      }}
                      placeholder={`Enter ${key}`}
                      className="bg-background border-border"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
              {error}
            </div>
          )}

          {output && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Output</Label>
              <pre className="text-sm p-3 border border-border rounded-md bg-muted text-foreground whitespace-pre-wrap break-words overflow-auto max-h-60">
                {JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button onClick={handleRun} disabled={running}>
            {running ? (
              "Running..."
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Tool
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
