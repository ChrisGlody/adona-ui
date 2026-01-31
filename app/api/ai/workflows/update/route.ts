import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { createAIWorkflow, getWorkflowWithSteps } from "@/lib/db/queries";

export async function PUT(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, name, description, inputSchema, outputSchema, definition } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }

    const existingWorkflow = await getWorkflowWithSteps(id, user.sub);
    if (!existingWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    if (definition) {
      if (!definition.nodes || !Array.isArray(definition.nodes)) {
        return NextResponse.json(
          { error: "Invalid definition: missing or invalid nodes array" },
          { status: 400 }
        );
      }
      if (!definition.edges || !Array.isArray(definition.edges)) {
        return NextResponse.json(
          { error: "Invalid definition: missing or invalid edges array" },
          { status: 400 }
        );
      }
      for (const node of definition.nodes) {
        if (!node.id || !node.name || !node.type) {
          return NextResponse.json(
            { error: "Invalid node: missing id, name, or type" },
            { status: 400 }
          );
        }
        if (!["tool", "inline", "http", "memory"].includes(node.type)) {
          return NextResponse.json(
            { error: `Invalid node type: ${node.type}` },
            { status: 400 }
          );
        }
      }
      const nodeIds = new Set(definition.nodes.map((n: { id: string }) => n.id));
      for (const edge of definition.edges) {
        if (!edge.source || !edge.target) {
          return NextResponse.json(
            { error: "Invalid edge: missing source or target" },
            { status: 400 }
          );
        }
        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
          return NextResponse.json(
            { error: "Invalid edge: references non-existent node" },
            { status: 400 }
          );
        }
      }
    }

    const workflowId = await createAIWorkflow({
      id,
      owner: user.sub,
      name: name ?? existingWorkflow.name,
      description: description !== undefined ? description : existingWorkflow.description,
      inputSchema: inputSchema !== undefined ? inputSchema : existingWorkflow.inputSchema,
      outputSchema: outputSchema !== undefined ? outputSchema : existingWorkflow.outputSchema,
      definition: definition ?? existingWorkflow.definition,
    });

    return NextResponse.json({
      ok: true,
      workflowId,
      message: "AI workflow updated successfully",
    });
  } catch (error) {
    console.error("Error updating AI workflow:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update AI workflow" },
      { status: 500 }
    );
  }
}
