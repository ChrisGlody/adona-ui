"use client";

import { useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RestoreConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (message?: string) => void;
  version: number;
  entityType: "workflow" | "tool";
  restoring?: boolean;
}

export function RestoreConfirmModal({
  open,
  onClose,
  onConfirm,
  version,
  entityType,
  restoring = false,
}: RestoreConfirmModalProps) {
  const [message, setMessage] = useState("");

  const handleConfirm = () => {
    onConfirm(message || undefined);
    setMessage("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Restore to Version {version}?
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            This will create a new version of the {entityType} based on version{" "}
            {version}. The current version will be preserved in history.
          </p>
          <div className="space-y-2">
            <Label htmlFor="restore-message" className="text-foreground">
              Change message (optional)
            </Label>
            <Input
              id="restore-message"
              placeholder={`Restored from version ${version}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-background border-border"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={restoring}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={restoring}>
            {restoring ? "Restoring..." : "Restore Version"}
          </Button>
        </div>
      </div>
    </div>
  );
}
