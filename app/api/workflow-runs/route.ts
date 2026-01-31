import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { listWorkflowRuns } from "@/lib/db/queries";

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
    const offset = (page - 1) * limit;

    const { items, total } = await listWorkflowRuns(user.sub, limit, offset);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      runs: items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error listing workflow runs:", error);
    return NextResponse.json({ error: "Failed to list runs" }, { status: 500 });
  }
}
