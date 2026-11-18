import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  autoProvisionStudentProfile,
  signSessionToken,
} from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeEmail, sanitizeString } from "@/lib/sanitize";
import { logAuditEvent } from "@/lib/audit";
import {
  hasUserCredential,
  registerUserCredential,
  verifyUserCredential,
} from "@/lib/password-security";

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
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        { error: "Unsupported Content-Type. Expected application/json." },
        { status: 415 }
      );
    }

    const body = await req.json();
    const { mode = "login", email, password, name, _hp_verify } = body ?? {};

    // 2. Bot / Spam Protection: Honeypot trap field (hidden from real users, populated by bots)
    if (_hp_verify && typeof _hp_verify === "string" && _hp_verify.trim().length > 0) {
      logAuditEvent("BOT_HONEYPOT_TRIGGERED", { ip, details: { mode } });
      return NextResponse.json(
        { error: "Suspicious submission blocked." },
        { status: 400 }
      );
    }

    // 3. Strict Server-Side Form Validation
    if (mode !== "login" && mode !== "signup") {
      return NextResponse.json(
        { error: "Invalid authentication mode." },
        { status: 400 }
      );
    }

    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      logAuditEvent("AUTH_LOGIN_FAILURE", {
        ip,
        details: { reason: "invalid_email_format" },
      });
      return NextResponse.json(
        { error: "Please provide a valid student or university email address." },
        { status: 400 }
      );
    }

    if (
      !password ||
      typeof password !== "string" ||
      password.length < 6 ||
      password.length > 128
    ) {
      logAuditEvent("AUTH_LOGIN_FAILURE", {
        ip,
        details: { reason: "invalid_password_length" },
      });
      return NextResponse.json(
        { error: "Password must be between 6 and 128 characters." },
        { status: 400 }
      );
    }

    const cleanName = sanitizeString(name, 100);

    // 4. Salted scrypt Password Hashing & Constant-Time Credential Verification
    let accountName = cleanName || sanitizedEmail.split("@")[0];
    let accountRole: "student" | "admin" = "student";

    if (mode === "signup") {
      if (!cleanName || cleanName.length < 2) {
        return NextResponse.json(
          { error: "Please provide your full name (at least 2 characters)." },
          { status: 400 }
        );
      }

      if (hasUserCredential(sanitizedEmail)) {
        logAuditEvent("AUTH_LOGIN_FAILURE", {
          ip,
          details: { reason: "duplicate_signup", email: sanitizedEmail },
        });
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in instead." },
          { status: 409 }
        );
      }

      const created = registerUserCredential(sanitizedEmail, cleanName, password);
      accountName = created.name;
      accountRole = created.role;
      await autoProvisionStudentProfile(accountName, sanitizedEmail);
    } else {
      const verified = verifyUserCredential(sanitizedEmail, password);
      if (!verified) {
        logAuditEvent("AUTH_LOGIN_FAILURE", {
          ip,
          details: { reason: "invalid_credentials" },
        });
        return NextResponse.json(
          {
            error:
              "Invalid email or password. If you are new to Intern Pilot, switch to Create Account.",
          },
          { status: 401 }
        );
      }
      accountName = verified.name;
      accountRole = verified.role;
    }

    const userSession = {
      userId: `student-${sanitizedEmail}`,
      email: sanitizedEmail,
      name: accountName,
      role: accountRole,
    };

    // 5. Cryptographically Sign Session Cookie (HMAC-SHA256 with expiration)
    const signedToken = await signSessionToken(userSession, 60 * 60 * 24 * 7);

    logAuditEvent("AUTH_LOGIN_SUCCESS", {
      actorId: userSession.userId,
      ip,
      details: { mode },
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
      value: signedToken,
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
