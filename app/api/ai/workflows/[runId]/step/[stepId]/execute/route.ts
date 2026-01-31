import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import {
  getWorkflowWithSteps,
  getRunStatus,
  createOrUpdateStepExecution,
  updateRunStatus,
} from "@/lib/db/queries";
import { getNextExecutableSteps, isWorkflowComplete } from "@/lib/workflows/graph-analyzer";
import { executeStep } from "@/lib/workflows/ai-step-executor";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ runId: string; stepId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { runId, stepId } = await params;
    const body = await req.json();
    const { input } = body;

    if (!runId || !stepId) {
      return NextResponse.json(
        { error: "Missing required parameters: runId and stepId" },
        { status: 400 }
      );
    }

    const runStatus = await getRunStatus(runId, user.sub);
    if (!runStatus) {
      return NextResponse.json({ error: "Workflow run not found" }, { status: 404 });
    }

    const { run, steps } = runStatus;
    const workflow = await getWorkflowWithSteps(run.workflowId, user.sub);
    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const def = workflow.definition as { nodes: { id: string; name?: string; type?: string }[] };
    const stepDef = def.nodes.find((n) => n.id === stepId);
    if (!stepDef) {
      return NextResponse.json(
        { error: "Step not found in workflow definition" },
        { status: 404 }
      );
    }

    const existingStep = steps.find((s: { stepId: string }) => s.stepId === stepId);
    if (existingStep && (existingStep as { status: string }).status === "completed") {
      return NextResponse.json({ error: "Step already completed" }, { status: 400 });
    }

    const stepOutputs: Record<string, unknown> = {};
    for (const s of steps) {
      const step = s as { status: string; stepId: string; output: unknown };
      if (step.status === "completed" && step.output) {
        stepOutputs[step.stepId] = step.output;
      }
    }

    // Convert envVars array to a key-value object
    const envVarsArray = (workflow.envVars as { key: string; value: string }[] | null) ?? [];
    const env: Record<string, string> = {};
    for (const envVar of envVarsArray) {
      if (envVar.key) {
        env[envVar.key] = envVar.value;
      }
    }

    const context = {
      workflowInput: run.input,
      stepOutputs,
      userId: user.sub,
      env,
    };

    await createOrUpdateStepExecution({
      runId,
      stepId,
      name: stepDef.name ?? stepId,
      type: stepDef.type ?? "tool",
      status: "running",
      startedAt: new Date(),
    });

    try {
      const output = await executeStep(stepDef, input ?? {}, context);

      await createOrUpdateStepExecution({
        runId,
        stepId,
        name: stepDef.name ?? stepId,
        type: stepDef.type ?? "tool",
        status: "completed",
        output,
        endedAt: new Date(),
      });

      const updatedRunStatus = await getRunStatus(runId, user.sub);
      const updatedSteps = updatedRunStatus?.steps ?? [];
      stepOutputs[stepId] = output;

      const completedSteps = updatedSteps
        .filter((s: { status: string }) => s.status === "completed")
        .map((s: { stepId: string; output: unknown }) => ({ stepId: s.stepId, output: s.output }));

      const nextSteps = getNextExecutableSteps(
        workflow.definition as { nodes: unknown[]; edges: unknown[] },
        completedSteps,
        stepOutputs,
        run.input
      );

      const workflowComplete = isWorkflowComplete(
        workflow.definition as { nodes: unknown[]; edges: unknown[] },
        completedSteps
      );

      if (workflowComplete) {
        await updateRunStatus({
          id: runId,
          status: "completed",
          output: stepOutputs,
          endedAt: new Date(),
        });
      }

      const executableSteps = nextSteps.map((step) => ({
        stepId: step.stepId,
        name: step.name,
        description: step.description,
        type: step.type,
        inputSchema: step.inputSchema,
      }));

      return NextResponse.json({
        ok: true,
        output,
        nextSteps: executableSteps,
        isComplete: workflowComplete,
        message: "Step executed successfully",
      });
    } catch (stepError: unknown) {
      await createOrUpdateStepExecution({
        runId,
        stepId,
        name: stepDef.name ?? stepId,
        type: stepDef.type ?? "tool",
        status: "failed",
        error: { message: stepError instanceof Error ? stepError.message : String(stepError) },
        endedAt: new Date(),
      });
      return NextResponse.json(
        {
          error: `Step execution failed: ${stepError instanceof Error ? stepError.message : String(stepError)}`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error executing AI workflow step:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute workflow step" },
      { status: 500 }
    );
  }
}
