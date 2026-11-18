export const AUTH_COOKIE_NAME = "internpilot_session";

export function sanitizeRedirect(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "/";
  const trimmed = url.trim();
  // Allow only relative same-origin paths; block //, /\, protocol schemes, and control chars
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\") &&
    !/[\r\n\0\\]/.test(trimmed)
  ) {
    return trimmed;
  }
  return "/";
}

export interface ClientSession {
  userId: string;
  email: string;
  name: string;
  role: "student" | "admin";
}

/**
 * Non-authoritative display helper only.
 * Server routes and middleware MUST always use verifySessionToken() for authorization.
 */
export function parseSessionToken(token: string | null | undefined): ClientSession | null {
  if (!token || typeof token !== "string") return null;
  try {
    const payloadPart = token.includes(".") ? token.split(".")[0] : token;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const jsonStr =
      typeof atob !== "undefined"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf-8");
    const parsed = JSON.parse(jsonStr);
    if (!parsed?.userId || !parsed?.email) return null;
    return parsed as ClientSession;
  } catch {
    return null;
  }
}


