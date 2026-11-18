import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeEmail } from "@/lib/sanitize";
import { logAuditEvent } from "@/lib/audit";
import {
  consumePasswordResetToken,
  createPasswordResetToken,
  hasUserCredential,
  updateUserPassword,
} from "@/lib/password-security";

/**
 * Short-lived (15-minute), single-use Password Reset API
 * Never discloses whether an email is registered on request (prevents account enumeration).
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Strict rate limit: max 5 reset attempts per 15 minutes per IP
  const rateCheck = checkRateLimit(`pwdreset:${ip}`, 5, 15 * 60);
  if (!rateCheck.allowed) {
    logAuditEvent("RATE_LIMIT_EXCEEDED", {
      ip,
      details: { endpoint: "/api/auth/reset-password", retryAfter: rateCheck.resetInSeconds },
    });
    return NextResponse.json(
      { error: "Too many password reset requests. Please try again later." },
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
    const { action, email, token, newPassword } = body ?? {};

    if (action === "request") {
      const cleanEmail = sanitizeEmail(email);
      if (!cleanEmail) {
        return NextResponse.json(
          { error: "Please provide a valid email address." },
          { status: 400 }
        );
      }

      if (hasUserCredential(cleanEmail)) {
        // Generates a 15-minute single-use token hashed at rest (sent via email service in production)
        createPasswordResetToken(cleanEmail);
      }

      logAuditEvent("PASSWORD_RESET_REQUESTED", {
        ip,
        details: { emailHashPrefix: cleanEmail.slice(0, 2) + "***" },
      });

      // Identical response regardless of account existence to prevent user enumeration
      return NextResponse.json({
        success: true,
        message:
          "If an account exists for that email, a single-use reset link valid for 15 minutes has been issued.",
      });
    }

    if (action === "confirm") {
      if (typeof token !== "string" || token.length < 32) {
        return NextResponse.json(
          { error: "Invalid or expired password reset link." },
          { status: 400 }
        );
      }

      if (
        typeof newPassword !== "string" ||
        newPassword.length < 6 ||
        newPassword.length > 128
      ) {
        return NextResponse.json(
          { error: "New password must be between 6 and 128 characters." },
          { status: 400 }
        );
      }

      const accountEmail = consumePasswordResetToken(token);
      if (!accountEmail) {
        return NextResponse.json(
          { error: "Reset link is invalid, expired, or has already been used." },
          { status: 400 }
        );
      }

      updateUserPassword(accountEmail, newPassword);
      logAuditEvent("PASSWORD_RESET_COMPLETED", {
        actorId: `student-${accountEmail}`,
        ip,
      });

      return NextResponse.json({
        success: true,
        message: "Password updated successfully. You may now sign in.",
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Expected 'request' or 'confirm'." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to process password reset request." },
      { status: 500 }
    );
  }
}
