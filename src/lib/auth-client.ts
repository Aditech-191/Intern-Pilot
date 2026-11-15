export const AUTH_COOKIE_NAME = "internpilot_session";

export function sanitizeRedirect(url: string | null | undefined): string {
  if (!url) return "/";
  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }
  return "/";
}

export interface ClientSession {
  userId: string;
  email: string;
  name: string;
  role: "student" | "admin";
}

export function parseSessionToken(token: string | null | undefined): ClientSession | null {
  if (!token) return null;
  try {
    const jsonStr = typeof atob !== "undefined"
      ? atob(token)
      : Buffer.from(token, "base64").toString("utf-8");
    const parsed = JSON.parse(jsonStr);
    if (!parsed?.userId || !parsed?.email) return null;
    return parsed as ClientSession;
  } catch {
    return null;
  }
}


