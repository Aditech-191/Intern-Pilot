import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, sanitizeRedirect } from "@/lib/auth-client";
import { verifySessionToken } from "@/lib/session-crypto";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const SENSITIVE_FILE_PATTERN =
  /^\/(\.env(\.|$)|\.git(\/|$)|.*\.bak$|.*\.backup$|.*\.sql$|.*\.pem$|.*\.key$)/i;

function isTrustedOrigin(
  originHeader: string,
  host: string | null,
  forwardedHost: string | null
): boolean {
  try {
    const parsed = new URL(originHeader);
    const originHost = parsed.host.toLowerCase();
    const allowedHosts = [
      host?.toLowerCase(),
      forwardedHost?.toLowerCase(),
      "localhost:3000",
      "127.0.0.1:3000",
      "internpilot.vercel.app",
    ].filter(Boolean);

    if (allowedHosts.includes(originHost)) return true;
    if (originHost.endsWith(".run.app") && parsed.protocol === "https:") return true;
    return false;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const host = request.headers.get("host");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  // 1. Block direct HTTP access to sensitive dotfiles or backup artifacts
  if (SENSITIVE_FILE_PATTERN.test(pathname)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 2. Enforce HTTPS in production (skip localhost/127.0.0.1 for local verification)
  const isLocalHost =
    !host || host.startsWith("localhost") || host.startsWith("127.0.0.1");
  if (
    process.env.NODE_ENV === "production" &&
    !isLocalHost &&
    forwardedProto === "http"
  ) {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 308);
  }

  // 3. Strict CORS & CSRF Protection on all API routes
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const secFetchSite = request.headers.get("sec-fetch-site");
    const method = request.method.toUpperCase();

    // Handle CORS preflight explicitly (never wildcard *)
    if (method === "OPTIONS") {
      if (origin && isTrustedOrigin(origin, host, forwardedHost)) {
        return new NextResponse(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
            Vary: "Origin",
          },
        });
      }
      return NextResponse.json(
        { error: "Cross-Origin Preflight Blocked by Security Policy." },
        { status: 403 }
      );
    }

    // Validate Origin header if provided
    if (origin && !isTrustedOrigin(origin, host, forwardedHost)) {
      console.warn(
        `[AUDIT_LOG] ${JSON.stringify({
          timestamp: new Date().toISOString(),
          eventType: "CSRF_REJECTED",
          details: { pathname, origin, reason: "untrusted_origin" },
        })}`
      );
      return NextResponse.json(
        { error: "Cross-Origin Request Blocked by Security Policy." },
        { status: 403 }
      );
    }

    // CSRF defense on state-changing requests (POST/PUT/PATCH/DELETE)
    if (STATE_CHANGING_METHODS.has(method)) {
      // Block cross-site browser requests via Fetch Metadata unless origin is explicitly allowlisted
      if (
        secFetchSite === "cross-site" &&
        (!origin || !isTrustedOrigin(origin, host, forwardedHost))
      ) {
        console.warn(
          `[AUDIT_LOG] ${JSON.stringify({
            timestamp: new Date().toISOString(),
            eventType: "CSRF_REJECTED",
            details: { pathname, secFetchSite, reason: "cross_site_fetch_metadata" },
          })}`
        );
        return NextResponse.json(
          { error: "Cross-Site Request Forgery Blocked." },
          { status: 403 }
        );
      }

      // If Origin is absent, verify Referer if present
      if (!origin && referer && !isTrustedOrigin(referer, host, forwardedHost)) {
        return NextResponse.json(
          { error: "Cross-Site Request Blocked by Referer Policy." },
          { status: 403 }
        );
      }

      // Require JSON content-type for non-logout POST bodies to block classic HTML form CSRF
      const contentType = (request.headers.get("content-type") || "").toLowerCase();
      if (
        pathname !== "/api/auth/logout" &&
        contentType &&
        !contentType.includes("application/json")
      ) {
        return NextResponse.json(
          { error: "CSRF protection requires application/json content type." },
          { status: 415 }
        );
      }
    }
  }

  // 4. Cryptographically verify signed session cookie (rejects forged Base64 cookies!)
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  if (sessionCookie && !session) {
    console.warn(
      `[AUDIT_LOG] ${JSON.stringify({
        timestamp: new Date().toISOString(),
        eventType: "INVALID_SESSION_SIGNATURE",
        details: { pathname },
      })}`
    );
  }

  // 5. Admin Page & Admin API Protection (Cryptographically Verified Server-Side Role Guard)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!session) {
      console.warn(
        `[AUDIT_LOG] ${JSON.stringify({
          timestamp: new Date().toISOString(),
          eventType: "UNAUTHORIZED_ADMIN_ACCESS",
          details: { pathname, reason: "unauthenticated" },
        })}`
      );
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Authentication required." },
          { status: 401 }
        );
      }
      return NextResponse.redirect(
        new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url)
      );
    }

    if (session.role !== "admin") {
      console.warn(
        `[AUDIT_LOG] ${JSON.stringify({
          timestamp: new Date().toISOString(),
          eventType: "UNAUTHORIZED_ADMIN_ACCESS",
          actorId: session.userId,
          details: { pathname, role: session.role },
        })}`
      );
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Access denied. Administrator privileges required." },
          { status: 403 }
        );
      }
      return NextResponse.redirect(
        new URL("/?error=unauthorized_admin_access", request.url)
      );
    }
  }

  // 6. Redirect verified authed users away from /login
  if (pathname === "/login" && session) {
    const redirectParam = searchParams.get("redirect");
    const safeUrl = sanitizeRedirect(redirectParam);
    if (safeUrl !== "/login") {
      return NextResponse.redirect(new URL(safeUrl, request.url));
    }
  }

  const response = NextResponse.next();

  // Attach explicit CORS header only for verified trusted origins on API responses
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    if (origin && isTrustedOrigin(origin, host, forwardedHost)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Vary", "Origin");
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
