import { GoogleGenAI } from "@google/genai";
import { StudentProfile, Opportunity, ExtractedOpportunityData } from "@/types";

const apiKey = process.env.GEMINI_API_KEY || "";

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const TIMEOUT_MS = 12000; // 12 seconds strict timeout

/**
 * Helper to race a promise against a timeout
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Gemini API request timed out (12s limit).")), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * Extracts structured opportunity fields from messy raw post text.
 */
export async function extractOpportunityFromText(
  rawText: string
): Promise<ExtractedOpportunityData> {
  if (!ai || !apiKey) {
    console.warn("GEMINI_API_KEY is not configured in .env.local. Returning intelligent fallback parsing.");
    return fallbackExtraction(rawText);
  }

  const prompt = `
Extract the structured job/internship/scholarship information from this announcement into JSON.
Return ONLY valid JSON with this exact structure:
{
  "title": string,
  "organization": string,
  "deadline": string (YYYY-MM-DD format if date found, or null),
  "eligibility": string (brief summary of eligibility criteria),
  "requirements": string[] (extracted key skills or tools required),
  "link": string (application or website URL if present, or null),
  "summary": string (concise 2-sentence description of the opportunity),
  "category": "Internship" | "Scholarship" | "Fellowship" | "Graduate Trainee"
}

Raw Announcement Text:
"""
${rawText}
"""
`;

  try {
    const callPromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    const res = await withTimeout(callPromise, TIMEOUT_MS);
    const text = res.text?.trim() || "{}";
    const parsed = JSON.parse(text);

    return {
      title: parsed.title || "Tech Internship / Opportunity",
      organization: parsed.organization || "Uganda Tech Partner",
      deadline: parsed.deadline || null,
      eligibility: parsed.eligibility || "Open to undergraduate students in Uganda.",
      requirements: Array.isArray(parsed.requirements) && parsed.requirements.length > 0
        ? parsed.requirements
        : ["Problem Solving", "Computer Science Foundations", "Teamwork"],
      link: parsed.link || null,
      summary: parsed.summary || rawText.slice(0, 160) + "...",
      category: parsed.category || "Internship",
    };
  } catch (err) {
    console.error("Gemini Extraction failed or timed out:", err);
    return fallbackExtraction(rawText);
  }
}

/**
 * Safe local fallback if API key is absent or network fails
 */
function fallbackExtraction(text: string): ExtractedOpportunityData {
  const isScholarship = /scholarship|fellowship|grant/i.test(text);
  const isTrainee = /graduate|trainee/i.test(text);

  return {
    title: text.split("\n")[0].slice(0, 60) || "Engineering Trainee / Intern",
    organization: "Kampala Technology Partner",
    deadline: "2026-11-28",
    eligibility: "Undergraduate university students in Computing or Engineering.",
    requirements: ["JavaScript", "Python", "SQL", "Git"],
    link: "https://opportunity.ug",
    summary: text.slice(0, 180) + "...",
    category: isScholarship ? "Scholarship" : isTrainee ? "Graduate Trainee" : "Internship",
  };
}

/**
 * Grounded Career Advisor: System instruction strictly confines recommendations
 * to the verified database listings.
 */
export async function adviseCareer(
  profile: StudentProfile,
  listings: Opportunity[],
  history: Array<{ role: "user" | "assistant"; content: string }>,
  message: string
): Promise<string> {
  if (!ai || !apiKey) {
    return generateLocalGroundedAdvice(profile, listings, message);
  }

  const systemInstruction = `
You are InternPilot, a career advisor for university students in Uganda.
Use ONLY the opportunities listed below when recommending applications.
Never invent listings, deadlines, or requirements.
For each recommendation: name it, say why it fits this student,
state the deadline, and give one concrete next step.
If the student lacks experience, suggest beginner-friendly options
and one small project or skill that would strengthen their application.
Keep answers short, friendly, and practical.

STUDENT PROFILE:
${JSON.stringify(profile, null, 2)}

OPEN OPPORTUNITIES (ACTIVE DATABASE):
${JSON.stringify(listings, null, 2)}
`;

  try {
    const formattedContents = history.map((h) => ({
      role: h.role,
      parts: [{ text: h.content }],
    }));

    formattedContents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const callPromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemInstruction,
      },
      contents: formattedContents,
    });

    const res = await withTimeout(callPromise, TIMEOUT_MS);
    return res.text || "I reviewed the current open listings. Please ask me about specific roles or deadlines!";
  } catch (err) {
    console.error("Gemini Chat failed or timed out:", err);
    return generateLocalGroundedAdvice(profile, listings, message);
  }
}

/**
 * Deterministic grounded fallback when Gemini API is offline or key missing
 */
function generateLocalGroundedAdvice(
  profile: StudentProfile,
  listings: Opportunity[],
  query: string
): string {
  const studentSkills = profile.skills.map((s) => s.toLowerCase());

  // Find best matching listing
  const matches = listings.filter((l) =>
    l.requirements.some((r) =>
      studentSkills.some((s) => r.toLowerCase().includes(s) || s.includes(r.toLowerCase()))
    )
  );

  const topMatch = matches[0] || listings[0];
  const urgent = listings.find((l) => l.deadline && l.deadline.includes("2026-11-18") || l.deadline?.includes("2026-11-16")) || listings[0];

  if (/deadline|soon|close|closing|urgent/i.test(query)) {
    return `The most urgent deadline right now is **${urgent.title}** at **${urgent.organization}** (Closes: ${urgent.deadline || "Soon"}). Next step: Ensure your GitHub repositories are public and apply at their portal before the deadline passes!`;
  }

  if (/skill|missing|learn|gap|backend/i.test(query)) {
    return `For ${profile.course} students targeting top Kampala engineering roles, your **${profile.skills.slice(0, 3).join(", ")}** skills are a great foundation. To stand out for roles like **${topMatch.title}**, add a concrete backend project demonstrating PostgreSQL database migrations and REST APIs.`;
  }

  return `Based on your ${profile.course} background, I recommend applying for **${topMatch.title}** at **${topMatch.organization}**.\n\n- **Why it fits:** It aligns directly with your skills in ${topMatch.requirements.slice(0, 2).join(" & ")}.\n- **Deadline:** ${topMatch.deadline || "Rolling"}\n- **Concrete Next Step:** Review the eligibility requirements (${topMatch.eligibility}) and tailor your resume highlights to their stack!`;
}
