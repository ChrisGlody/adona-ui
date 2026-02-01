import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { getWorkflowVersions } from "@/lib/db/queries";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const versions = await getWorkflowVersions(id, user.sub);

  if (!versions) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  return NextResponse.json({ versions });
}
