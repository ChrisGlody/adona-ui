import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = [
  "/",
  "/links",
  "/chat",
  "/tools",
  "/workflows",
  "/ai",
  "/hybrid-search",
  "/deterministic-inference",
  "/workflow-runs",
  "/workflow-builder",
  "/function-registry",
  "/skills-registry",
  "/bixbench",
  "/rl-studio",
  "/skill-designer",
];

function isProtectedPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  if (isProtectedPath(pathname) && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
