import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";
import {
  fetchProfessionalProfileSummary,
  validateProfileLookupInput,
} from "@/lib/services/professional-profile-service";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const session = await getCurrentSession();

  // Rate limit real-time Google Search grounding calls: 10 per minute per user/IP
  const rateLimitKey = `profile-insights:${session?.userId || ip}`;
  const rateCheck = checkRateLimit(rateLimitKey, 10, 60);
  if (!rateCheck.allowed) {
    logAuditEvent("RATE_LIMIT_EXCEEDED", {
      actorId: session?.userId,
      ip,
      details: { endpoint: "/api/profile/insights" },
    });
    return NextResponse.json(
      {
        error:
          "Rate limit reached for real-time profile insights. Please wait a minute before refreshing.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateCheck.resetInSeconds) },
      }
    );
  }

  try {
    const contentLength = Number(req.headers.get("content-length") || "0");
    if (contentLength > 16 * 1024) {
      return NextResponse.json(
        { error: "Request payload exceeds the 16KB limit." },
        { status: 413 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        { error: "Unsupported Content-Type. Expected application/json." },
        { status: 415 }
      );
    }

    const body = await req.json();
    const validated = validateProfileLookupInput({
      name: body?.name,
      university: body?.university,
      course: body?.course,
      linkedinUrl: body?.linkedinUrl,
      githubUrl: body?.githubUrl,
      existingSkills: body?.existingSkills,
    });

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const insights = await fetchProfessionalProfileSummary(validated.data);

    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to fetch real-time professional insights right now.";
    console.error("API /api/profile/insights error:", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
