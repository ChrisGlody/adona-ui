"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Pencil, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type WorkflowRow = {
  id: string;
  name: string;
  description?: string | null;
  executionEnv?: string | null;
  updatedAt?: string | null;
};

export function WorkflowsTable() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [page, setPage] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/workflows/list");
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        setWorkflows(data.workflows ?? []);
      } catch {
        setWorkflows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const total = workflows.length;
  const rpp = parseInt(rowsPerPage, 10) || 10;
  const totalPages = Math.max(1, Math.ceil(total / rpp));
  const start = page * rpp;
  const end = Math.min(start + rpp, total);
  const pageRows = workflows.slice(start, end);

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
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No workflows yet. Create one above.
                </td>
              </tr>
            ) : (
              pageRows.map((w) => (
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

      {total > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {start + 1}–{end} of {total}
            </span>
            <span className="text-border">|</span>
            <span className="font-medium">{rowsPerPage}</span>
            <span>rows per page</span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
              <SelectTrigger className="w-20 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-sm text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
