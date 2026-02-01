import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { restoreWorkflowVersion } from "@/lib/db/queries";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, version } = await params;
  const versionNum = parseInt(version, 10);

  if (isNaN(versionNum)) {
    return NextResponse.json(
      { error: "Invalid version number" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const result = await restoreWorkflowVersion(
    id,
    versionNum,
    user.sub,
    body.changeMessage
  );

  if (!result) {
    return NextResponse.json(
      { error: "Failed to restore version" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, ...result });
}
