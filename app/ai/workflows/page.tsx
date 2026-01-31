"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MainNav } from "@/components/main-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  inputSchema: unknown;
  outputSchema: unknown;
  definition: { nodes?: unknown[]; edges?: unknown[] };
  createdAt: string;
  updatedAt: string;
}

export default function AIWorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflows();
  }, []);

  async function loadWorkflows() {
    try {
      const res = await fetch("/api/ai/workflows/list");
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data.workflows ?? []);
      }
    } catch (error) {
      console.error("Failed to load workflows:", error);
    } finally {
      setLoading(false);
    }
  }

  async function testWorkflow(workflowId: string) {
    try {
      const testInput = { test: "Hello from AI workflow test" };
      const runRes = await fetch("/api/ai/workflows/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, input: testInput }),
      });
      if (!runRes.ok) {
        const error = await runRes.json();
        alert(`Failed to start workflow: ${error.error}`);
        return;
      }
      const { runId, nextSteps } = await runRes.json();
      let currentSteps = nextSteps ?? [];
      const stepOutputs: Record<string, unknown> = {};
      while (currentSteps.length > 0) {
        for (const step of currentSteps) {
          const executeRes = await fetch(
            `/api/ai/workflows/${runId}/step/${step.stepId}/execute`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ input: testInput }),
            }
          );
          if (!executeRes.ok) {
            const err = await executeRes.json();
            throw new Error(`Step failed: ${err.error}`);
          }
          const { output, nextSteps: newSteps, isComplete } = await executeRes.json();
          stepOutputs[step.stepId] = output;
          currentSteps = newSteps ?? [];
          if (isComplete) {
            alert(`Workflow completed! Output: ${JSON.stringify(stepOutputs, null, 2)}`);
            return;
          }
        }
      }
    } catch (error) {
      console.error("Workflow test failed:", error);
      alert(`Workflow test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MainNav />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading AI workflows..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />
      <div className="p-6 container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">AI Workflows</h1>
          <Link href="/workflows">
            <Button variant="outline">Back to All Workflows</Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          These workflows are designed for AI agent execution.
        </p>
        {workflows.length === 0 ? (
          <Card className="p-6 text-center bg-card border-border">
            <p className="text-muted-foreground">
              No AI workflows found. Create workflows with database execution environment.
            </p>
            <Link href="/workflows">
              <Button className="mt-4">Create Workflow</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="p-4 bg-card border-border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground">{workflow.name}</h3>
                    {workflow.description && (
                      <p className="text-muted-foreground mt-1">{workflow.description}</p>
                    )}
                    <div className="mt-2 text-sm text-muted-foreground">
                      Steps: {workflow.definition?.nodes?.length ?? 0}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link href={`/workflows/${workflow.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => testWorkflow(workflow.id)}>
                      Test Run
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
