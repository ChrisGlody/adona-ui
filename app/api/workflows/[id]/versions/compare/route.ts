import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { compareWorkflowVersions } from "@/lib/db/queries";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const url = new URL(req.url);
  const versionA = parseInt(url.searchParams.get("a") ?? "", 10);
  const versionB = parseInt(url.searchParams.get("b") ?? "", 10);

  if (isNaN(versionA) || isNaN(versionB)) {
    return NextResponse.json(
      { error: "Invalid version numbers. Use ?a=1&b=2" },
      { status: 400 }
    );
  }

  const comparison = await compareWorkflowVersions(id, versionA, versionB, user.sub);

  return NextResponse.json(comparison);
}
