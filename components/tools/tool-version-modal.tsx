"use client";

import { useState } from "react";
import { X, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VersionHistoryPanel, VersionCompareModal, RestoreConfirmModal } from "@/components/versioning";

interface ToolVersionModalProps {
  open: boolean;
  onClose: () => void;
  toolId: string;
  toolName: string;
  currentVersion: number;
  onRestored?: () => void;
}

export function ToolVersionModal({
  open,
  onClose,
  toolId,
  toolName,
  currentVersion,
  onRestored,
}: ToolVersionModalProps) {
  const [compareVersions, setCompareVersions] = useState<{ a: number; b: number } | null>(null);
  const [restoreVersion, setRestoreVersion] = useState<number | null>(null);
  const [restoring, setRestoring] = useState(false);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Version History: {toolName}
              </h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <VersionHistoryPanel
              entityType="tool"
              entityId={toolId}
              currentVersion={currentVersion}
              onRestore={(v) => setRestoreVersion(v)}
              onCompare={(a, b) => setCompareVersions({ a, b })}
            />
          </div>
        </div>
      </div>

      {/* Version Compare Modal */}
      {compareVersions && (
        <VersionCompareModal
          open={!!compareVersions}
          onClose={() => setCompareVersions(null)}
          entityType="tool"
          entityId={toolId}
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
              await fetch(`/api/tools/${toolId}/versions/${restoreVersion}/restore`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ changeMessage: message }),
              });
              setRestoreVersion(null);
              onRestored?.();
              onClose();
            } catch (error) {
              console.error("Error restoring version:", error);
            } finally {
              setRestoring(false);
            }
          }}
          version={restoreVersion}
          entityType="tool"
          restoring={restoring}
        />
      )}
    </>
  );
}
