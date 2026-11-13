import { NextResponse } from "next/server";
import { adviseCareer } from "@/lib/gemini";
import { getOpportunities } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profile, message, history = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message content is required." },
        { status: 400 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Active student profile is required to generate personalized advice." },
        { status: 400 }
      );
    }

    // Always fetch active database listings
    const openListings = await getOpportunities();

    const responseText = await adviseCareer(profile, openListings, history, message);

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
