import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { createRun, getWorkflow } from "@/lib/db/queries";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { workflowId, input, resumeRunId } = await req.json();
    const owner = user.sub;
    const wfRows = await getWorkflow(workflowId, owner);
    if (wfRows.length === 0) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

    const runId = resumeRunId ?? uuidv4();

    if (!resumeRunId) {
      await createRun({ workflowId, owner, input });
    }

    return NextResponse.json({ ok: true, runId });
  } catch (e) {
    console.error("Error running workflow:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
