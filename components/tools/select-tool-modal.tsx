"use client";

import { useState, useEffect } from "react";
import { X, Search, Code, Globe, Zap, Wrench, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface Tool {
  id: string;
  name: string;
  description: string | null;
  type: string;
  inputSchema: Record<string, unknown>;
}

interface SelectToolModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (tool: Tool) => void;
}

function getToolIcon(type: string) {
  switch (type) {
    case "db":
    case "s3-inline":
      return { icon: Code, bg: "bg-blue-100", color: "text-blue-600" };
    case "http":
      return { icon: Globe, bg: "bg-green-100", color: "text-green-600" };
    case "lambda":
      return { icon: Zap, bg: "bg-amber-100", color: "text-amber-600" };
    default:
      return { icon: Wrench, bg: "bg-slate-100", color: "text-slate-600" };
  }
}

export function SelectToolModal({ open, onClose, onSelect }: SelectToolModalProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch("/api/tools/list")
        .then((res) => res.json())
        .then((data) => {
          setTools(data.tools || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open]);

  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      (tool.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const handleSelect = () => {
    const tool = tools.find((t) => t.id === selectedId);
    if (tool) {
      onSelect(tool);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Select Tool</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools..."
              className="pl-9 bg-background border-border"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading tools...
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {tools.length === 0
                ? "No tools available. Create a tool first."
                : "No tools match your search."}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTools.map((tool) => {
                const { icon: Icon, bg, color } = getToolIcon(tool.type);
                const isSelected = selectedId === tool.id;
                return (
                  <button
                    key={tool.id}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedId(tool.id)}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {tool.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {tool.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {tool.description || "No description"}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedId}>
            Select Tool
          </Button>
        </div>
      </div>
    </div>
  );
}
