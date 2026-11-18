import { NextResponse } from "next/server";
import { adviseCareer } from "@/lib/gemini";
import { getCurrentSession, assertResourceOwnership } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeChatMessage, sanitizeString } from "@/lib/sanitize";
import { logAuditEvent } from "@/lib/audit";
import { Opportunity, ProfessionalProfileSummary, StudentProfile } from "@/types";

function sanitizeInsightsPayload(input: unknown): ProfessionalProfileSummary | null {
  if (!input || typeof input !== "object") return null;
  const p = input as Record<string, unknown>;
  const confidence =
    p.confidence === "verified_web" ||
    p.confidence === "partial" ||
    p.confidence === "not_found"
      ? p.confidence
      : "partial";
  return {
    headline: sanitizeString(p.headline, 160),
    summary: sanitizeString(p.summary, 900),
    extractedSkills: Array.isArray(p.extractedSkills)
      ? p.extractedSkills.slice(0, 20).map((s) => sanitizeString(s, 60)).filter(Boolean)
      : [],
    experienceHighlights: Array.isArray(p.experienceHighlights)
      ? p.experienceHighlights.slice(0, 6).map((s) => sanitizeString(s, 180)).filter(Boolean)
      : [],
    educationHighlights: Array.isArray(p.educationHighlights)
      ? p.educationHighlights.slice(0, 4).map((s) => sanitizeString(s, 180)).filter(Boolean)
      : [],
    alignmentNotes: sanitizeString(p.alignmentNotes, 500),
    sources: [],
    fetchedAt: sanitizeString(p.fetchedAt, 40),
    confidence,
  };
}

function sanitizeOpportunitiesPayload(input: unknown): Opportunity[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 60).map((item, idx) => {
    const o = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      id: sanitizeString(o.id, 80) || `opp-${idx}`,
      title: sanitizeString(o.title, 180) || "Untitled Opportunity",
      organization: sanitizeString(o.organization, 140) || "Unspecified",
      location: sanitizeString(o.location, 140) || "Not listed",
      region: (sanitizeString(o.region, 40) as Opportunity["region"]) || "Nationwide",
      city: sanitizeString(o.city, 80) || "",
      stipend: o.stipend ? sanitizeString(o.stipend, 100) : null,
      deadline: o.deadline ? sanitizeString(o.deadline, 20) : null,
      eligibility: sanitizeString(o.eligibility, 400) || "Not listed",
      requirements: Array.isArray(o.requirements)
        ? o.requirements.slice(0, 25).map((r) => sanitizeString(r, 80)).filter(Boolean)
        : [],
      link: o.link ? sanitizeString(o.link, 300) : null,
      summary: sanitizeString(o.summary, 600) || "",
      category: (sanitizeString(o.category, 40) as Opportunity["category"]) || "Internship",
      is_verified: Boolean(o.is_verified),
      created_at: sanitizeString(o.created_at, 30) || "",
    };
  });
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const session = await getCurrentSession();

  const rateLimitKey = `chat:${session?.userId || ip}`;
  const rateCheck = checkRateLimit(rateLimitKey, 20, 60);
  if (!rateCheck.allowed) {
    logAuditEvent("RATE_LIMIT_EXCEEDED", {
      actorId: session?.userId,
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
    const contentLength = Number(req.headers.get("content-length") || "0");
    if (contentLength > 64 * 1024) {
      return NextResponse.json(
        { error: "Request payload exceeds the 64KB limit." },
        { status: 413 }
      );
    }

    const body = await req.json();
    const {
      profile,
      message,
      history = [],
      opportunities = [],
      professionalInsights = null,
    } = body;

    const cleanMessage = sanitizeChatMessage(message);
    if (!cleanMessage) {
      return NextResponse.json(
        { error: "A non-empty message is required." },
        { status: 400 }
      );
    }

    if (!profile || typeof profile !== "object") {
      return NextResponse.json(
        { error: "Student profile object is required." },
        { status: 400 }
      );
    }

    // If user is authenticated and targeting a server-owned student-* profile, enforce ownership
    if (
      session &&
      typeof profile.id === "string" &&
      profile.id.startsWith("student-") &&
      !assertResourceOwnership(session, profile.id)
    ) {
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

    // Strictly use ONLY the user-inputted opportunities in the workspace
    const userOpportunities = sanitizeOpportunitiesPayload(opportunities);
    const cleanInsights = sanitizeInsightsPayload(
      professionalInsights ?? profile.professionalInsights
    );
    const cleanHistory = Array.isArray(history)
      ? history
          .slice(-10)
          .filter(
            (h): h is { role: "user" | "assistant"; content: string } =>
              Boolean(
                h &&
                  (h.role === "user" || h.role === "assistant") &&
                  typeof h.content === "string"
              )
          )
          .map((h) => ({
            role: h.role,
            content: sanitizeChatMessage(h.content),
          }))
      : [];

    const responseText = await adviseCareer(
      profile as StudentProfile,
      userOpportunities,
      cleanHistory,
      cleanMessage,
      cleanInsights
    );

    return NextResponse.json({
      success: true,
      response: responseText,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Career Advisor service encountered an error. Please try again.";
    console.error("API /api/gemini/chat error:", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
