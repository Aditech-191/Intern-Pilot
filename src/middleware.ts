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
    const forwardedHost = request.headers.get("x-forwarded-host");

    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        // Verify that the origin matches the application host, forwarded proxy host, or configured domain
        const allowedHosts = [host, forwardedHost, "localhost:3000", "internpilot.vercel.app"].filter(Boolean);
        const isAllowedProxyHost = originHost.endsWith(".run.app");
        if (!allowedHosts.includes(originHost) && !isAllowedProxyHost) {
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

  // 3. Redirect authed users away from /login
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


