import { NextRequest, NextResponse } from "next/server";
import { setTokenCookie } from "@/lib/cookies";
import { MOCK_AUTH_TOKEN } from "@/lib/auth.server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = (body?.token as string) ?? MOCK_AUTH_TOKEN;
    if (!token || token.trim() === "") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }
    await setTokenCookie(token);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to set token" }, { status: 500 });
  }
}
