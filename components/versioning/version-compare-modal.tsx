"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Editor from "@monaco-editor/react";

interface VersionCompareModalProps {
  open: boolean;
  onClose: () => void;
  entityType: "workflow" | "tool";
  entityId: string;
  versionA: number;
  versionB: number;
}

export function VersionCompareModal({
  open,
  onClose,
  entityType,
  entityId,
  versionA,
  versionB,
}: VersionCompareModalProps) {
  const [loading, setLoading] = useState(true);
  const [dataA, setDataA] = useState<object | null>(null);
  const [dataB, setDataB] = useState<object | null>(null);

  useEffect(() => {
    if (!open) return;

    async function fetchComparison() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/${entityType}s/${entityId}/versions/compare?a=${versionA}&b=${versionB}`
        );
        const data = await res.json();
        setDataA(data.versionA);
        setDataB(data.versionB);
      } catch (error) {
        console.error("Error fetching comparison:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchComparison();
  }, [open, entityType, entityId, versionA, versionB]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-6xl h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            Compare Version {versionA} vs Version {versionB}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner size="lg" text="Loading comparison..." />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="flex flex-col h-full">
                <div className="font-medium text-sm mb-2 px-3 py-2 bg-muted rounded-t-lg text-foreground">
                  Version {versionA}
                </div>
                <div className="flex-1 border border-border rounded-b-lg overflow-hidden">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={JSON.stringify(dataA, null, 2)}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 12,
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col h-full">
                <div className="font-medium text-sm mb-2 px-3 py-2 bg-muted rounded-t-lg text-foreground">
                  Version {versionB}
                </div>
                <div className="flex-1 border border-border rounded-b-lg overflow-hidden">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={JSON.stringify(dataB, null, 2)}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 12,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
