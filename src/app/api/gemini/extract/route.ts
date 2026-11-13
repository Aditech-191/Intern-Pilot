import { NextResponse } from "next/server";
import { extractOpportunityFromText } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide non-empty opportunity announcement text to extract." },
        { status: 400 }
      );
    }

    const extracted = await extractOpportunityFromText(text);
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

