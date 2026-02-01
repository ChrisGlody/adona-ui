import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { getTool } from "@/lib/db/queries";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const rows = await getTool(id, user.sub);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // First check if the tool exists and belongs to the user
  const rows = await getTool(id, user.sub);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Import db and tools for deletion
  const { db } = await import("@/lib/db");
  const { tools } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  await db.delete(tools).where(eq(tools.id, id));

  return NextResponse.json({ ok: true });
}
