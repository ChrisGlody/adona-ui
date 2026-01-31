import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { getWorkflowWithSteps, createWorkflowRun } from "@/lib/db/queries";
import { getNextExecutableSteps } from "@/lib/workflows/graph-analyzer";

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { workflowId, input } = body;

    if (!workflowId) {
      return NextResponse.json(
        { error: "Missing required field: workflowId" },
        { status: 400 }
      );
    }

    const workflow = await getWorkflowWithSteps(workflowId, user.sub);
    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }
    if (workflow.executionEnv !== "db") {
      return NextResponse.json(
        { error: "This endpoint only supports AI workflows (executionEnv = 'db')" },
        { status: 400 }
      );
    }
    if (workflow.inputSchema && (workflow.inputSchema as { type?: string }).type === "object" && typeof input !== "object") {
      return NextResponse.json(
        { error: "Input does not match workflow input schema" },
        { status: 400 }
      );
    }

    const runId = await createWorkflowRun({
      workflowId,
      owner: user.sub,
      input: input ?? {},
    });

    const nextSteps = getNextExecutableSteps(
      workflow.definition as { nodes: unknown[]; edges: unknown[] },
      [],
      {}
    );

    const executableSteps = nextSteps.map((step) => ({
      stepId: step.stepId,
      name: step.name,
      description: step.description,
      type: step.type,
      inputSchema: step.inputSchema,
    }));

    return NextResponse.json({
      ok: true,
      runId,
      workflowId,
      nextSteps: executableSteps,
      isComplete: executableSteps.length === 0,
      message: "Workflow run initialized successfully",
    });
  } catch (error) {
    console.error("Error initializing AI workflow run:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to initialize workflow run" },
      { status: 500 }
    );
  }
}
