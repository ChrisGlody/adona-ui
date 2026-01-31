import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { getUserWorkflows } from "@/lib/db/queries";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const workflows = await getUserWorkflows(user.sub, "db");
    const workflowList = workflows.map((wf) => ({
      id: wf.id,
      name: wf.name,
      description: wf.description,
      inputSchema: wf.inputSchema,
      outputSchema: wf.outputSchema,
      definition: wf.definition,
      createdAt: wf.createdAt,
      updatedAt: wf.updatedAt,
    }));
    return NextResponse.json({
      ok: true,
      workflows: workflowList,
      count: workflowList.length,
    });
  } catch (error) {
    console.error("Error listing AI workflows:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list AI workflows" },
      { status: 500 }
    );
  }
}
