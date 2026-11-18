import { cookies } from "next/headers";
import { StudentProfile } from "@/types";
import { saveProfile, getProfiles } from "./db";
import {
  signSessionToken,
  verifySessionToken,
  SessionPayload,
} from "./session-crypto";

export const AUTH_COOKIE_NAME = "internpilot_session";

export type UserSession = SessionPayload;

export { sanitizeRedirect } from "./auth-client";
export { signSessionToken, verifySessionToken };

export async function getCurrentSession(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  const verified = await verifySessionToken(sessionCookie);
  if (!verified) return null;

  return {
    userId: verified.userId,
    email: verified.email,
    name: verified.name,
    role: verified.role,
  };
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
