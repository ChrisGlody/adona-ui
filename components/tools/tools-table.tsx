"use client";

import { useState } from "react";
import {
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Play,
  Code,
  Globe,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Tool {
  id: string;
  name: string;
  description: string | null;
  type: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown> | null;
  implementation: string | null;
  lambdaArn?: string | null;
  owner?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface ToolsTableProps {
  tools: Tool[];
  loading?: boolean;
  onEdit?: (tool: Tool) => void;
  onDelete?: (tool: Tool) => void;
  onRun?: (tool: Tool) => void;
  onView?: (tool: Tool) => void;
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getToolIcon(type: string) {
  switch (type) {
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

export function ToolsTable({
  tools,
  loading,
  onEdit,
  onDelete,
  onRun,
  onView,
}: ToolsTableProps) {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);

  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedRows((prev) =>
      prev.length === tools.length ? [] : tools.map((t) => t.id)
    );
  };

  const rowsPerPageNum = parseInt(rowsPerPage, 10);
  const totalPages = Math.ceil(tools.length / rowsPerPageNum);
  const startIndex = (currentPage - 1) * rowsPerPageNum;
  const endIndex = startIndex + rowsPerPageNum;
  const paginatedTools = tools.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-lg overflow-hidden border border-border">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
          <Wrench className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold text-foreground">Tools Registry</span>
        </div>
        <div className="p-12 text-center text-muted-foreground">
          Loading tools...
        </div>
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-lg overflow-hidden border border-border">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
          <Wrench className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold text-foreground">Tools Registry</span>
        </div>
        <div className="p-12 text-center text-muted-foreground">
          No tools registered yet. Create your first tool to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-lg overflow-hidden border border-border">
      {/* Table Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
        <Wrench className="h-5 w-5 text-muted-foreground" />
        <span className="font-semibold text-foreground">Tools Registry</span>
        <span className="text-sm text-muted-foreground ml-2">
          ({tools.length} total)
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-4 text-left">
                <Checkbox
                  checked={selectedRows.length === tools.length && tools.length > 0}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                Tool Name
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                Description
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                Type
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                Created
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedTools.map((tool) => {
              const { icon: Icon, bg, color } = getToolIcon(tool.type);
              return (
                <tr
                  key={tool.id}
                  className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={selectedRows.includes(tool.id)}
                      onCheckedChange={() => toggleRow(tool.id)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}
                      >
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <span className="font-semibold text-foreground">
                        {tool.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground max-w-xs truncate">
                    {tool.description || "No description"}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {tool.type}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {formatDateTime(tool.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {onRun && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-green-200 hover:bg-green-50 bg-transparent"
                          onClick={() => onRun(tool)}
                          title="Run tool"
                        >
                          <Play className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {onView && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-blue-200 hover:bg-blue-50 bg-transparent"
                          onClick={() => onView(tool)}
                          title="View details"
                        >
                          <Search className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-border hover:bg-muted bg-transparent"
                          onClick={() => onEdit(tool)}
                          title="Edit tool"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-red-200 hover:bg-red-50 bg-transparent"
                          onClick={() => onDelete(tool)}
                          title="Delete tool"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {startIndex + 1}–{Math.min(endIndex, tools.length)} of {tools.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={rowsPerPage} onValueChange={(v) => { setRowsPerPage(v); setCurrentPage(1); }}>
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
              className="h-9 w-9 bg-transparent"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {currentPage}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-transparent"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
