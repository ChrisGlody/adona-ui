import { NextResponse } from "next/server";
import { clearTokenCookie } from "@/lib/cookies";

export async function POST() {
  try {
    await clearTokenCookie();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
