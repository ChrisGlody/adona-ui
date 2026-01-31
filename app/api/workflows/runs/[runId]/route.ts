import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { getRun } from "@/lib/db/queries";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { runId } = await params;

  try {
    const result = await getRun(runId, user.sub);
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ run: result.run, steps: result.steps });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
