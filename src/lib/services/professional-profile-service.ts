import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { ProfessionalProfileSummary } from "@/types";
import {
  ValidatedProfileLookup,
  buildProfessionalLookupQuery,
  extractGroundingSources,
  parseProfessionalSummaryResponse,
} from "./professional-profile-utils";

export {
  validateProfileLookupInput,
  buildProfessionalLookupQuery,
  extractGroundingSources,
  parseProfessionalSummaryResponse,
  getNewDiscoveredSkills,
} from "./professional-profile-utils";
export type {
  ProfileLookupRequest,
  ValidatedProfileLookup,
  LookupValidationResult,
} from "./professional-profile-utils";

const MODEL_NAME = "gemini-4-hydrogen";
const TIMEOUT_MS = 45000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            "Real-time Google & LinkedIn profile lookup timed out. Please try again."
          )
        ),
      timeoutMs
    );
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Server-side service layer entry point:
 * Queries Google's real-time web data via @google/genai googleSearch grounding
 * to retrieve publicly indexed Google & LinkedIn professional summaries and skills.
 */
export async function fetchProfessionalProfileSummary(
  input: ValidatedProfileLookup
): Promise<ProfessionalProfileSummary> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured on the server. Please attach a Gemini API key in Settings > Secrets."
    );
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  const prompt = buildProfessionalLookupQuery(input);

  const attemptModels: Array<{ model: string; useThinkingLow: boolean }> = [
    { model: MODEL_NAME, useThinkingLow: true },
    { model: "gemini-3.1-flash-lite", useThinkingLow: false },
  ];

  let lastError: unknown = null;

  for (const candidate of attemptModels) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: candidate.model,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            ...(candidate.useThinkingLow
              ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
              : {}),
          },
        }),
        TIMEOUT_MS
      );

      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = extractGroundingSources(groundingChunks);
      const rawText = response.text || "";

      return parseProfessionalSummaryResponse(rawText, sources, {
        queriedLinkedinUrl: input.linkedinUrl,
        queriedName: input.name || null,
      });
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message.toUpperCase() : "";
      const isQuota = msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429");
      if (!isQuota) break;
    }
  }

  const raw = lastError instanceof Error ? lastError.message : String(lastError ?? "");
  const upper = raw.toUpperCase();

  if (
    upper.includes("API_KEY_INVALID") ||
    upper.includes("PERMISSION_DENIED") ||
    upper.includes("403")
  ) {
    throw new Error(
      "Your Gemini API key was rejected. Please check or select a valid key in Settings > Secrets."
    );
  }
  if (upper.includes("RESOURCE_EXHAUSTED") || upper.includes("429")) {
    throw new Error(
      "Google Search real-time grounding quota was reached on the current free-tier API key. Select a billing-enabled Gemini API key in Settings > Secrets to enable live Google & LinkedIn lookups."
    );
  }
  throw new Error(
    raw ||
      "Unable to fetch real-time Google & LinkedIn profile insights right now. Please try again."
  );
}
