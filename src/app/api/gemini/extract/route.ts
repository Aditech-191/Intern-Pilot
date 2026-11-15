import { NextResponse } from "next/server";
import { extractOpportunityFromText } from "@/lib/gemini";
import { getCurrentSession } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeOpportunityText } from "@/lib/sanitize";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const session = await getCurrentSession();

  // 1. Server-Side Authentication Guard (Never trust frontend alone)
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required to ingest opportunities." },
      { status: 401 }
    );
  }

  // 2. Rate Limiting: Max 20 extractions per minute per user/IP
  const rateLimitKey = `extract:${session.userId || ip}`;
  const rateCheck = checkRateLimit(rateLimitKey, 20, 60);
  if (!rateCheck.allowed) {
    logAuditEvent("RATE_LIMIT_EXCEEDED", {
      actorId: session.userId,
      ip,
      details: { endpoint: "/api/gemini/extract" },
    });
    return NextResponse.json(
      { error: "Rate limit reached for AI text extraction. Please wait a minute." },
      {
        status: 429,
        headers: { "Retry-After": String(rateCheck.resetInSeconds) },
      }
    );
  }

  try {
    const body = await req.json();
    const { text } = body;

    // 3. Input Sanitization & Payload Constraints
    const cleanText = sanitizeOpportunityText(text);
    if (!cleanText || cleanText.length < 10) {
      return NextResponse.json(
        { error: "Please provide valid announcement text with at least 10 characters." },
        { status: 400 }
      );
    }

    const extracted = await extractOpportunityFromText(cleanText);

    return NextResponse.json({ success: true, data: extracted });
  } catch (error) {
    console.error("API /api/gemini/extract error:", error);
    return NextResponse.json(
      {
        error: "Unable to process text extraction at this moment. Returning fallback structure.",
        fallback: true,
      },
      { status: 500 }
    );
  }
}


