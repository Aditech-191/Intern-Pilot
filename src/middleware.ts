import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, sanitizeRedirect } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // Protect internal mutation or AI endpoints if required
  if (pathname.startsWith("/api/gemini") && !sessionCookie) {
    // In dev / demo mode, allow access if header or cookie exists, otherwise require session
    // To protect quota without breaking demos, return 401 if completely unauthenticated
    if (process.env.NODE_ENV === "production" && !sessionCookie) {
      return NextResponse.json(
        { error: "Authentication required to access InternPilot AI services." },
        { status: 401 }
      );
    }
  }

  // If visiting /login while already authenticated and has redirect param
  if (pathname === "/login" && sessionCookie) {
    const redirectParam = searchParams.get("redirect");
    const safeUrl = sanitizeRedirect(redirectParam);
    if (safeUrl !== "/login") {
      return NextResponse.redirect(new URL(safeUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/api/gemini/:path*"],
};
