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
    if (!parsed?.userId || !parsed?.email) {
      return null;
    }
    return parsed as UserSession;
  } catch {
    return null;
  }
}

/**
 * Asserts that the authenticated session is an administrator.
 * Throws an explicit error or returns false to prevent unauthorized access.
 */
export function isAdmin(session: UserSession | null): boolean {
  return Boolean(session && session.role === "admin");
}

/**
 * IDOR Defense: Verifies that the current authenticated user owns the resource.
 * Admins are permitted bypass for management purposes.
 */
export function assertResourceOwnership(
  session: UserSession | null,
  resourceOwnerId: string
): boolean {
  if (!session) return false;
  if (session.role === "admin") return true;
  return session.userId === resourceOwnerId;
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
    name: name || "",
    email,
    university: "",
    course: "",
    year_of_study: null,
    cgpa: "",
    skills: [],
    interests: [],
    experience_summary: "",
  };

  await saveProfile(newProfile);
  return newProfile;
}
