"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Editor from "@monaco-editor/react";

interface CreateToolModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const DEFAULT_CODE = `export async function main(input) {
  // Your tool logic here
  // input contains the parameters defined in inputSchema

  return {
    result: "Hello from tool!"
  };
}`;

const DEFAULT_INPUT_SCHEMA = `{
  "type": "object",
  "properties": {
    "message": {
      "type": "string",
      "description": "Input message"
    }
  },
  "required": ["message"]
}`;

const DEFAULT_OUTPUT_SCHEMA = `{
  "type": "object",
  "properties": {
    "result": {
      "type": "string",
      "description": "Output result"
    }
  }
}`;

export function CreateToolModal({ open, onClose, onCreated }: CreateToolModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [inputSchema, setInputSchema] = useState(DEFAULT_INPUT_SCHEMA);
  const [outputSchema, setOutputSchema] = useState(DEFAULT_OUTPUT_SCHEMA);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI generation state
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerateFromAI = async () => {
    if (!aiPrompt.trim()) {
      setError("Please enter a description for the tool");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/tools/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate tool");
      }

      const tool = data.tool;
      setName(tool.name || "");
      setDescription(tool.description || "");
      setCode(tool.code || DEFAULT_CODE);
      setInputSchema(JSON.stringify(tool.inputSchema || {}, null, 2));
      setOutputSchema(JSON.stringify(tool.outputSchema || {}, null, 2));
      setAiPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate tool");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async () => {
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
          name: name.trim(),
          description: description.trim() || null,
          type: "db",
          inputSchema: parsedInputSchema,
          outputSchema: parsedOutputSchema,
          code,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create tool");
      }

      // Reset form
      setName("");
      setDescription("");
      setCode(DEFAULT_CODE);
      setInputSchema(DEFAULT_INPUT_SCHEMA);
      setOutputSchema(DEFAULT_OUTPUT_SCHEMA);
      setAiPrompt("");

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tool");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Create New Tool</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI Generator */}
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
            <div className="flex items-center gap-2 text-primary font-medium">
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </div>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe the tool you want to create...&#10;&#10;Example: Create a tool that fetches weather data for a city using the OpenWeatherMap API"
              className="min-h-[80px] bg-background border-border"
              disabled={generating}
            />
            <Button
              onClick={handleGenerateFromAI}
              disabled={generating || !aiPrompt.trim()}
              className="w-full"
            >
              {generating ? (
                <>Generating...</>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Tool
                </>
              )}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or edit manually</span>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tool Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., multiply_numbers"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this tool do?"
                className="bg-background border-border"
              />
            </div>
          </div>

          {/* Code Editor */}
          <div className="space-y-2">
            <Label>Implementation Code</Label>
            <p className="text-xs text-muted-foreground">
              Write an async function that receives input and returns a result.
            </p>
            <div className="border border-border rounded-lg overflow-hidden">
              <Editor
                height={200}
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

          {/* Schemas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Input Schema (JSON)</Label>
              <div className="border border-border rounded-lg overflow-hidden">
                <Editor
                  height={150}
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
            <div className="space-y-2">
              <Label>Output Schema (JSON)</Label>
              <div className="border border-border rounded-lg overflow-hidden">
                <Editor
                  height={150}
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

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? "Creating..." : "Create Tool"}
          </Button>
        </div>
      </div>
    </div>
  );
}
