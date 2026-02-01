import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { createOrUpdateWorkflowWithVersioning } from "@/lib/db/queries";

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, name, description, inputSchema, outputSchema, definition, changeMessage } = body;

    if (!name || !definition) {
      return NextResponse.json(
        { error: "Missing required fields: name and definition" },
        { status: 400 }
      );
    }
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
      if (!["tool", "inline", "memory", "llm", "inference"].includes(node.type)) {
        return NextResponse.json(
          { error: `Invalid node type: ${node.type}. Must be one of: tool, inline, memory, llm, inference` },
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

    const result = await createOrUpdateWorkflowWithVersioning({
      id,
      owner: user.sub,
      name,
      description: description ?? null,
      inputSchema: inputSchema ?? null,
      outputSchema: outputSchema ?? null,
      definition,
      changeMessage,
    });

    return NextResponse.json({
      ok: true,
      workflowId: result.id,
      version: result.version,
      message: "AI workflow created successfully",
    });
  } catch (error) {
    console.error("Error creating AI workflow:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create AI workflow" },
      { status: 500 }
    );
  }
}
