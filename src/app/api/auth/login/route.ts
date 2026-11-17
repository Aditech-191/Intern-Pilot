import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, autoProvisionStudentProfile } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeEmail, sanitizeString } from "@/lib/sanitize";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // 1. Rate Limiting: Max 10 attempts per minute per IP to block brute-force attacks
  const rateCheck = checkRateLimit(`auth:${ip}`, 10, 60);
  if (!rateCheck.allowed) {
    logAuditEvent("RATE_LIMIT_EXCEEDED", {
      ip,
      details: { endpoint: "/api/auth/login", retryAfter: rateCheck.resetInSeconds },
    });
    return NextResponse.json(
      { error: "Too many authentication requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateCheck.resetInSeconds) },
      }
    );
  }

  try {
    const body = await req.json();
    const { mode, email, password, name, _hp_verify } = body;

    // 2. Bot / Spam Protection: Honeypot trap field (hidden from real users, populated by dumb bots)
    if (_hp_verify && typeof _hp_verify === "string" && _hp_verify.trim().length > 0) {
      logAuditEvent("BOT_HONEYPOT_TRIGGERED", { ip, details: { mode } });
      return NextResponse.json(
        { error: "Suspicious submission blocked." },
        { status: 400 }
      );
    }

    // 3. Input Sanitization & Server-Side Validation
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      logAuditEvent("AUTH_LOGIN_FAILURE", { ip, details: { reason: "invalid_email_format" } });
      return NextResponse.json(
        { error: "Please provide a valid student or university email address." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      logAuditEvent("AUTH_LOGIN_FAILURE", { ip, details: { reason: "short_password" } });
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const cleanName = sanitizeString(name, 100);

    if (mode === "signup") {
      await autoProvisionStudentProfile(cleanName || sanitizedEmail.split("@")[0], sanitizedEmail);
    }

    const userSession = {
      userId: `student-${sanitizedEmail}`,
      email: sanitizedEmail,
      name: cleanName || sanitizedEmail.split("@")[0],
      role: "student" as const,
    };

    const encoded = Buffer.from(JSON.stringify(userSession)).toString("base64");

    logAuditEvent("AUTH_LOGIN_SUCCESS", {
      actorId: userSession.userId,
      ip,
      details: { mode: mode || "login" },
    });

    const response = NextResponse.json({
      success: true,
      user: userSession,
    });

    const isHttps =
      req.headers.get("x-forwarded-proto") === "https" ||
      req.url.startsWith("https://") ||
      process.env.NODE_ENV === "production";

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: encoded,
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error("Auth login error:", err);
    return NextResponse.json(
      { error: "Authentication service encountered an error." },
      { status: 500 }
    );
  }
}


