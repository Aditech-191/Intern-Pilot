import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, sanitizeRedirect, parseSessionToken } from "@/lib/auth-client";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = parseSessionToken(sessionCookie);

  // 1. CORS & Origin lockdown for API routes: Block unauthorized cross-origin requests
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        // Verify that the origin matches the application host or configured domain
        const allowedHosts = [host, "localhost:3000", "internpilot.vercel.app"];
        if (!allowedHosts.includes(originHost)) {
          return NextResponse.json(
            { error: "Cross-Origin Request Blocked by Security Policy." },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Malformed origin header." },
          { status: 400 }
        );
      }
    }
  }

  // 2. Admin Page & Admin API Protection (Server-Side Role Guard)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!session) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Authentication required." },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url));
    }

    if (session.role !== "admin") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Access denied. Administrator privileges required." },
          { status: 403 }
        );
      }
      // Redirect unauthorized students back to home with an access error
      return NextResponse.redirect(new URL("/?error=unauthorized_admin_access", request.url));
    }
  }

  // 3. API Auth Enforcement for AI & Ingestion services
  const isProtectedApi =
    pathname.startsWith("/api/gemini") ||
    pathname.startsWith("/api/advisor") ||
    pathname.startsWith("/api/ingest");

  if (isProtectedApi && !session) {
    return NextResponse.json(
      { error: "Authentication required to access InternPilot AI services." },
      { status: 401 }
    );
  }

  // 4. Redirect authed users away from /login
  if (pathname === "/login" && session) {
    const redirectParam = searchParams.get("redirect");
    const safeUrl = sanitizeRedirect(redirectParam);
    if (safeUrl !== "/login") {
      return NextResponse.redirect(new URL(safeUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/admin/:path*",
    "/api/:path*",
  ],
};


