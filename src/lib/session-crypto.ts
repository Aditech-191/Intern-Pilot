/**
 * Cryptographic Session Signing & Verification (HMAC-SHA256)
 * Uses Web Crypto API so it runs identically in Edge Middleware and Node.js API routes.
 */

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "student" | "admin";
}

export interface VerifiedSession extends SessionPayload {
  iat: number;
  exp: number;
}

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Process-scoped fallback secret if SESSION_SECRET env var is unset during local/preview runs.
// Uses globalThis so Edge/Node hot-reloads in the same isolate share the key.
const GLOBAL_SECRET_KEY = "__internpilot_runtime_session_secret__";
let warnedMissingSecret = false;

function getSessionSecret(): string {
  const configured = process.env.SESSION_SECRET?.trim();
  if (configured && configured.length >= 16) {
    return configured;
  }

  if (process.env.NODE_ENV === "production" && !warnedMissingSecret) {
    warnedMissingSecret = true;
    console.warn(
      "[SECURITY] SESSION_SECRET is not configured. Using an ephemeral runtime secret; configure a 32+ character SESSION_SECRET environment variable for persistent sessions."
    );
  }

  const g = globalThis as Record<string, unknown>;
  if (typeof g[GLOBAL_SECRET_KEY] !== "string") {
    const bytes = new Uint8Array(32);
    globalThis.crypto.getRandomValues(bytes);
    g[GLOBAL_SECRET_KEY] = Array.from(bytes, (b) =>
      b.toString(16).padStart(2, "0")
    ).join("");
  }
  return g[GLOBAL_SECRET_KEY] as string;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 =
    typeof btoa !== "undefined"
      ? btoa(binary)
      : Buffer.from(bytes).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(input: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(input)) return null;
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (input.length % 4)) % 4);
  try {
    if (typeof atob !== "undefined") {
      const binary = atob(padded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
    return new Uint8Array(Buffer.from(padded, "base64"));
  } catch {
    return null;
  }
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const keyBytes = new TextEncoder().encode(secret);
  return globalThis.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Produces a tamper-proof signed session token: `<base64url(payload)>.<base64url(hmac)>`
 */
export async function signSessionToken(
  session: SessionPayload,
  ttlSeconds = DEFAULT_TTL_SECONDS,
  secretOverride?: string
): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  const fullPayload: VerifiedSession = {
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    iat: nowSec,
    exp: nowSec + ttlSeconds,
  };

  const payloadBytes = new TextEncoder().encode(JSON.stringify(fullPayload));
  const payloadB64 = bytesToBase64Url(payloadBytes);

  const key = await importHmacKey(secretOverride || getSessionSecret());
  const sigBuf = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64)
  );
  const sigB64 = bytesToBase64Url(new Uint8Array(sigBuf));

  return `${payloadB64}.${sigB64}`;
}

/**
 * Verifies HMAC-SHA256 signature and expiration timestamp.
 * Rejects unsigned Base64 cookies, tampered payloads, and expired tokens.
 */
export async function verifySessionToken(
  token: string | null | undefined,
  secretOverride?: string
): Promise<VerifiedSession | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  const providedSig = base64UrlToBytes(sigB64);
  if (!providedSig || providedSig.length !== 32) return null;

  try {
    const key = await importHmacKey(secretOverride || getSessionSecret());
    const expectedSigBuf = await globalThis.crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(payloadB64)
    );
    const expectedSig = new Uint8Array(expectedSigBuf);

    if (!constantTimeEqual(providedSig, expectedSig)) {
      return null;
    }

    const payloadBytes = base64UrlToBytes(payloadB64);
    if (!payloadBytes) return null;

    const parsed = JSON.parse(new TextDecoder().decode(payloadBytes)) as Partial<VerifiedSession>;
    if (
      typeof parsed.userId !== "string" ||
      !parsed.userId ||
      typeof parsed.email !== "string" ||
      !parsed.email ||
      typeof parsed.name !== "string" ||
      (parsed.role !== "student" && parsed.role !== "admin") ||
      typeof parsed.exp !== "number" ||
      typeof parsed.iat !== "number"
    ) {
      return null;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (parsed.exp <= nowSec) {
      return null;
    }

    return parsed as VerifiedSession;
  } catch {
    return null;
  }
}
