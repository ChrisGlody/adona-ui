"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkflowsTable } from "@/components/workflows/workflows-table";

export default function WorkflowsPage() {
  const router = useRouter();
  const [name, setName] = useState("");

  async function handleCreate() {
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || "New Workflow",
        definition: { nodes: [], edges: [] },
      }),
    });
    const data = await res.json();
    if (data?.id) router.push(`/workflows/${data.id}/edit`);
    else if (data?.error && res.status === 401) router.replace("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />

      <div className="bg-gradient-to-r from-primary/90 to-accent/90 relative overflow-hidden">
        <div className="relative container mx-auto px-6 py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-primary-foreground mb-2">
                Workflows
              </h2>
              <p className="text-primary-foreground/70">
                Create and manage workflow definitions. Edit to design steps; use Runs to execute.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex gap-2 items-center bg-primary-foreground/10 rounded-lg px-3 py-2">
                <Input
                  placeholder="Workflow name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background border-border w-48 text-foreground placeholder:text-muted-foreground"
                />
                <Button
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2"
                  onClick={handleCreate}
                >
                  <Plus className="h-4 w-4" />
                  Create workflow
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 bg-background">
        <div className="container mx-auto px-6 py-8">
          <WorkflowsTable />
        </div>
      </main>
    </div>
  );
}
