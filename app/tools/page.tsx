"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Settings, Wrench } from "lucide-react";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ToolsTable, type Tool } from "@/components/tools/tools-table";
import { CreateToolModal } from "@/components/tools/create-tool-modal";
import { RunToolModal } from "@/components/tools/run-tool-modal";
import { ToolVersionModal } from "@/components/tools/tool-version-modal";

export default function ToolsPage() {
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<Tool[]>([]);
  const [fetchingTools, setFetchingTools] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const router = useRouter();

  const fetchTools = async () => {
    setFetchingTools(true);
    try {
      const res = await fetch("/api/tools/list");
      const data = await res.json();
      if (data.tools) setTools(data.tools);
    } catch (error) {
      console.error("Error fetching tools:", error);
    } finally {
      setFetchingTools(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/secure");
        if (!res.ok) {
          if (mounted) router.replace("/login");
          return;
        }
        if (mounted) await fetchTools();
      } catch {
        if (mounted) router.replace("/login");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleRunTool = (tool: Tool) => {
    setSelectedTool(tool);
    setRunModalOpen(true);
  };

  const handleEditTool = (tool: Tool) => {
    router.push(`/tools/${tool.id}/edit`);
  };

  const handleViewHistory = (tool: Tool) => {
    setSelectedTool(tool);
    setVersionModalOpen(true);
  };

  const handleDeleteTool = async (tool: Tool) => {
    if (!confirm(`Are you sure you want to delete "${tool.name}"?`)) return;
    try {
      const res = await fetch(`/api/tools/${tool.id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchTools();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete tool");
      }
    } catch (err) {
      console.error("Error deleting tool:", err);
      alert("Failed to delete tool");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MainNav />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading tools..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />

      {/* Hero Section with Gradient Background */}
      <div className="bg-gradient-to-r from-primary/90 to-accent/90 relative overflow-hidden">
        {/* Secondary Navigation */}
        <div className="relative border-b border-primary-foreground/10">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-14">
              <h1 className="text-xl font-semibold text-primary-foreground">
                <span className="font-light">Reusable</span> Tools Registry
              </h1>
              <nav className="flex items-center gap-6 text-sm">
                <span className="text-primary-foreground font-medium">
                  Tools
                </span>
                <span className="text-primary-foreground/50">|</span>
                <span className="text-primary-foreground/70">
                  {tools.length} registered
                </span>
              </nav>
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="relative container mx-auto px-6 py-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-primary-foreground mb-2 flex items-center gap-3">
                <Wrench className="h-8 w-8" />
                Tools Registry
              </h2>
              <p className="text-primary-foreground/70">
                Create and manage reusable tools that can be used in your workflows.
                Tools are like inline code but created separately for reusability.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Create New Tool
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-6 py-8">
          <ToolsTable
            tools={tools}
            loading={fetchingTools}
            onRun={handleRunTool}
            onEdit={handleEditTool}
            onDelete={handleDeleteTool}
            onViewHistory={handleViewHistory}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-primary/80 to-accent/80 border-t border-primary-foreground/10 py-6">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center gap-4">
            <p className="text-primary-foreground/60 text-sm">
              Tools are reusable code snippets that can be called from workflows
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateToolModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={fetchTools}
      />
      <RunToolModal
        open={runModalOpen}
        tool={selectedTool}
        onClose={() => {
          setRunModalOpen(false);
          setSelectedTool(null);
        }}
      />
      {selectedTool && (
        <ToolVersionModal
          open={versionModalOpen}
          onClose={() => {
            setVersionModalOpen(false);
            setSelectedTool(null);
          }}
          toolId={selectedTool.id}
          toolName={selectedTool.name}
          currentVersion={selectedTool.currentVersion ?? 1}
          onRestored={fetchTools}
        />
      )}
    </div>
  );
}
