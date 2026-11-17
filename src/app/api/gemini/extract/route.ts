import { NextResponse } from "next/server";
import { extractOpportunityFromText } from "@/lib/gemini";
import { getCurrentSession } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeOpportunityText } from "@/lib/sanitize";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const session = await getCurrentSession();

  const rateLimitKey = `extract:${session?.userId || ip}`;
  const rateCheck = checkRateLimit(rateLimitKey, 20, 60);
  if (!rateCheck.allowed) {
    logAuditEvent("RATE_LIMIT_EXCEEDED", {
      actorId: session?.userId,
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

    const cleanText = sanitizeOpportunityText(text);
    if (!cleanText || cleanText.length < 10) {
      return NextResponse.json(
        { error: "Please paste announcement text with at least 10 characters." },
        { status: 400 }
      );
    }

    const extracted = await extractOpportunityFromText(cleanText);
    return NextResponse.json({ success: true, data: extracted });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to extract opportunity details right now.";
    console.error("API /api/gemini/extract error:", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
