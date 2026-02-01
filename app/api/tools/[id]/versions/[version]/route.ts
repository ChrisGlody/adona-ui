import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { getToolVersion } from "@/lib/db/queries";

export async function GET(
  _: Request,
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

  const versionData = await getToolVersion(id, versionNum, user.sub);

  if (!versionData) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  return NextResponse.json({ version: versionData });
}
