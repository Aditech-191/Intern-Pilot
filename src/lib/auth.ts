import { cookies } from "next/headers";
import { StudentProfile } from "@/types";
import { SEED_PROFILES } from "./seed-data";
import { saveProfile, getProfiles } from "./db";

export const AUTH_COOKIE_NAME = "internpilot_session";

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: "student" | "admin";
}

export { sanitizeRedirect } from "./auth-client";

export async function getCurrentSession(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const parsed = JSON.parse(Buffer.from(sessionCookie, "base64").toString("utf8"));
    return parsed as UserSession;
  } catch {
    return null;
  }
}

export async function autoProvisionStudentProfile(
  name: string,
  email: string
): Promise<StudentProfile> {
  const profiles = await getProfiles();
  const existing = profiles.find((p) => p.id === `student-${email}`);
  if (existing) return existing;

  const newProfile: StudentProfile = {
    id: `student-${email}`,
    name: name || "Makerere Student",
    university: "Makerere University",
    course: "BSc. Software Engineering",
    year_of_study: 3,
    skills: ["React", "TypeScript", "Python", "SQL", "Git"],
    interests: ["Full-Stack Web", "Fintech", "AI"],
    experience_summary: "Student builder focused on software engineering opportunities in Uganda.",
  };

  await saveProfile(newProfile);
  return newProfile;
}
