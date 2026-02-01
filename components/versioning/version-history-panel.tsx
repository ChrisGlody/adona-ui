"use client";

import { useState, useEffect } from "react";
import { History, RotateCcw, GitCompare, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Version {
  id: string;
  version: number;
  changeType: string;
  changeMessage?: string | null;
  changedBy: string;
  createdAt: string;
}

interface VersionHistoryPanelProps {
  entityType: "workflow" | "tool";
  entityId: string;
  currentVersion: number;
  onRestore?: (version: number) => void;
  onCompare?: (versionA: number, versionB: number) => void;
  onView?: (version: number) => void;
}

export function VersionHistoryPanel({
  entityType,
  entityId,
  currentVersion,
  onRestore,
  onCompare,
  onView,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);

  useEffect(() => {
    async function fetchVersions() {
      setLoading(true);
      try {
        const res = await fetch(`/api/${entityType}s/${entityId}/versions`);
        const data = await res.json();
        setVersions(data.versions ?? []);
      } catch (error) {
        console.error("Error fetching versions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchVersions();
  }, [entityType, entityId]);

  const toggleVersionSelect = (version: number) => {
    setSelectedVersions((prev) => {
      if (prev.includes(version)) {
        return prev.filter((v) => v !== version);
      }
      if (prev.length >= 2) {
        return [prev[1], version];
      }
      return [...prev, version];
    });
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2 && onCompare) {
      onCompare(
        Math.min(...selectedVersions),
        Math.max(...selectedVersions)
      );
    }
  };

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getChangeTypeBadge(changeType: string) {
    const styles: Record<string, string> = {
      create: "bg-green-100 text-green-700",
      update: "bg-blue-100 text-blue-700",
      restore: "bg-amber-100 text-amber-700",
    };
    return styles[changeType] ?? "bg-gray-100 text-gray-700";
  }

  if (loading) {
    return (
      <Card className="p-4 bg-card border-border">
        <LoadingSpinner size="sm" text="Loading version history..." />
      </Card>
    );
  }

  if (versions.length === 0) {
    return (
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center gap-2 mb-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold text-foreground">Version History</span>
        </div>
        <p className="text-sm text-muted-foreground">No version history available.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4 bg-card border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold text-foreground">Version History</span>
          <span className="text-sm text-muted-foreground">
            (v{currentVersion})
          </span>
        </div>
        {selectedVersions.length === 2 && (
          <Button size="sm" variant="outline" onClick={handleCompare}>
            <GitCompare className="h-4 w-4 mr-2" />
            Compare
          </Button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {versions.map((v) => (
          <div
            key={v.id}
            className={`p-3 rounded-lg border transition-colors cursor-pointer ${
              selectedVersions.includes(v.version)
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/50"
            }`}
            onClick={() => toggleVersionSelect(v.version)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">v{v.version}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getChangeTypeBadge(
                      v.changeType
                    )}`}
                  >
                    {v.changeType}
                  </span>
                  {v.version === currentVersion && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                      current
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {v.changeMessage ?? "No description"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(v.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {onView && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(v.version);
                    }}
                    title="View this version"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {onRestore && v.version !== currentVersion && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestore(v.version);
                    }}
                    title="Restore this version"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
