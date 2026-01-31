import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { tools } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth.server";

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, inputSchema, outputSchema, code, type, executionEnv } = body;

  const id = uuidv4();
  const env = executionEnv ?? "db";

  await db.insert(tools).values({
    id,
    owner: user.sub,
    name: name ?? "Unnamed",
    description: description ?? null,
    type: type ?? "s3-inline",
    inputSchema: inputSchema ?? {},
    outputSchema: outputSchema ?? null,
    implementation: code ?? null,
    executionEnv: env,
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true, toolId: id, executionEnv: env });
}
