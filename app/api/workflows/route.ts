import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { createOrUpdateWorkflowWithVersioning } from "@/lib/db/queries";

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, name, description, executionEnv, inputSchema, outputSchema, envVars, definition, changeMessage } = body;
    if (!name || !definition) {
      return NextResponse.json({ error: "Missing name or definition" }, { status: 400 });
    }

    const env = executionEnv ?? "db";

    const result = await createOrUpdateWorkflowWithVersioning({
      id,
      owner: user.sub,
      name,
      description,
      inputSchema,
      outputSchema,
      envVars,
      definition,
      executionEnv: env,
      changeMessage,
    });

    return NextResponse.json({ ok: true, id: result.id, version: result.version, executionEnv: env });
  } catch (e: unknown) {
    console.error("Error saving workflow:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save workflow" },
      { status: 500 }
    );
  }
}
