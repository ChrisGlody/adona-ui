"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Pencil, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PaginationControls } from "@/components/ui/pagination";

type WorkflowRow = {
  id: string;
  name: string;
  description?: string | null;
  executionEnv?: string | null;
  updatedAt?: string | null;
};

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function WorkflowsTable() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  const fetchWorkflows = useCallback(async (currentPage: number, currentLimit: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workflows/list?page=${currentPage}&limit=${currentLimit}`);
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const data = await res.json();
      setWorkflows(data.workflows ?? []);
      setPagination(data.pagination ?? null);
    } catch {
      setWorkflows([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchWorkflows(page, limit);
  }, [page, limit, fetchWorkflows]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  };

  function formatDate(value: string | null | undefined): string {
    if (!value) return "—";
    try {
      const d = new Date(value);
      return d.toLocaleDateString(undefined, { dateStyle: "short" });
    } catch {
      return "—";
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden p-12">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading workflows..." />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
        <GitBranch className="h-5 w-5 text-muted-foreground" />
        <span className="font-semibold text-foreground">Workflows</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                Description
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                Execution env
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                Updated
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {workflows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No workflows yet. Create one above.
                </td>
              </tr>
            ) : (
              workflows.map((w) => (
                <tr
                  key={w.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <GitBranch className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">{w.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground max-w-xs truncate">
                    {w.description ?? "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-foreground">
                    {w.executionEnv === "s3" ? "S3 + Lambda" : "Database (AI-driven)"}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {formatDate(w.updatedAt)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => router.push(`/workflows/${w.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4 text-foreground" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => router.push(`/workflows/${w.id}/runs`)}
                      >
                        <Play className="h-4 w-4 text-foreground" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > 0 && (
        <div className="px-4 border-t border-border">
          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </div>
      )}
    </div>
  );
}
