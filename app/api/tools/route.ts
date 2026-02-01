import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { createOrUpdateToolWithVersioning } from "@/lib/db/queries";

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, name, description, inputSchema, outputSchema, code, type, executionEnv, changeMessage } = body;

  const env = executionEnv ?? "db";

  const result = await createOrUpdateToolWithVersioning({
    id,
    owner: user.sub,
    name: name ?? "Unnamed",
    description: description ?? null,
    type: type ?? "db",
    inputSchema: inputSchema ?? {},
    outputSchema: outputSchema ?? null,
    implementation: code ?? null,
    executionEnv: env,
    changeMessage,
  });

  return NextResponse.json({ ok: true, toolId: result.id, version: result.version, executionEnv: env });
}
