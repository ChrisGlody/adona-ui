import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { createAIWorkflow } from "@/lib/db/queries";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, name, description, executionEnv, inputSchema, outputSchema, envVars, definition } = body;
    if (!name || !definition) {
      return NextResponse.json({ error: "Missing name or definition" }, { status: 400 });
    }

    const wfId = id ?? uuidv4();
    const env = executionEnv ?? "db";

    await createAIWorkflow({
      id: wfId,
      owner: user.sub,
      name,
      description,
      inputSchema,
      outputSchema,
      envVars,
      definition,
    });

    return NextResponse.json({ ok: true, id: wfId, executionEnv: env });
  } catch (e: unknown) {
    console.error("Error saving workflow:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save workflow" },
      { status: 500 }
    );
  }
}
