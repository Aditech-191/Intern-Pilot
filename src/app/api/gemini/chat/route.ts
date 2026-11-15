import { NextResponse } from "next/server";
import { adviseCareer } from "@/lib/gemini";
import { getOpportunities } from "@/lib/db";
import { getCurrentSession, assertResourceOwnership } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeChatMessage } from "@/lib/sanitize";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const session = await getCurrentSession();

  // 1. Server-Side Authentication Guard
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required to access AI Career Advisor." },
      { status: 401 }
    );
  }

  // 2. Rate Limiting: Max 20 advisor calls per minute per user
  const rateLimitKey = `chat:${session.userId || ip}`;
  const rateCheck = checkRateLimit(rateLimitKey, 20, 60);
  if (!rateCheck.allowed) {
    logAuditEvent("RATE_LIMIT_EXCEEDED", {
      actorId: session.userId,
      ip,
      details: { endpoint: "/api/gemini/chat" },
    });
    return NextResponse.json(
      { error: "Rate limit exceeded for Career Advisor. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(rateCheck.resetInSeconds) },
      }
    );
  }

  try {
    const body = await req.json();
    const { profile, message, history = [] } = body;

    // 3. Input Sanitization
    const cleanMessage = sanitizeChatMessage(message);
    if (!cleanMessage) {
      return NextResponse.json(
        { error: "A non-empty message is required." },
        { status: 400 }
      );
    }

    if (!profile || typeof profile !== "object") {
      return NextResponse.json(
        { error: "Active student profile is required to generate personalized advice." },
        { status: 400 }
      );
    }

    // 4. IDOR Defense: Ensure students cannot spoof another user's profile unless demo profile or owned
    const isDemoProfile = profile.id?.startsWith("student-alex") || profile.id?.startsWith("student-amina");
    if (!isDemoProfile && !assertResourceOwnership(session, profile.id)) {
      logAuditEvent("IDOR_ATTEMPT_BLOCKED", {
        actorId: session.userId,
        ip,
        details: { targetProfileId: profile.id },
      });
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to access this student profile." },
        { status: 403 }
      );
    }

    // Always fetch active database listings
    const openListings = await getOpportunities();

    const responseText = await adviseCareer(profile, openListings, history, cleanMessage);

    return NextResponse.json({
      success: true,
      response: responseText,
    });
  } catch (error) {
    console.error("API /api/gemini/chat error:", error);
    return NextResponse.json(
      {
        error: "Career Advisor service encountered a brief delay. Showing active opportunities below.",
        fallback: true,
      },
      { status: 500 }
    );
  }
}


