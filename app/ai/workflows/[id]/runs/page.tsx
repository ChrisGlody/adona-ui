"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MainNav } from "@/components/main-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AIWorkflowRunsPage() {
  const params = useParams<{ id: string }>();
  const workflowId = params?.id as string;
  const [workflow, setWorkflow] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workflowId) return;
    (async () => {
      try {
        const res = await fetch(`/api/workflows/${workflowId}`);
        if (res.ok) {
          const data = await res.json();
          setWorkflow(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [workflowId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MainNav />
        <div className="p-6">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />
      <div className="p-6 container mx-auto space-y-4">
        <Link href="/ai/workflows" className="text-muted-foreground hover:text-foreground">
          Back to AI Workflows
        </Link>
        <Card className="p-4 bg-card border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Runs for workflow: {workflow?.name ?? workflowId}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Start a run from the workflow edit or runs page.
          </p>
          <Link href={`/workflows/${workflowId}/runs`}>
            <Button className="mt-4">Open Workflow Runs</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
