import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { listWorkflowRuns } from "@/lib/db/queries";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const runs = await listWorkflowRuns(user.sub);
    return NextResponse.json({ runs });
  } catch (error) {
    console.error("Error listing workflow runs:", error);
    return NextResponse.json({ error: "Failed to list runs" }, { status: 500 });
  }
}
