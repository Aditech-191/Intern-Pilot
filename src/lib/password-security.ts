import crypto from "crypto";

/**
 * Password Hashing (memory-hard scrypt) & Single-Use Expiring Password Reset Tokens
 * Never stores plain-text passwords or raw reset tokens.
 */

const SCRYPT_KEYLEN = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };
const DEFAULT_RESET_TTL_MS = 15 * 60 * 1000; // 15 minutes

export interface StoredCredential {
  email: string;
  name: string;
  passwordHash: string;
  role: "student" | "admin";
  createdAt: number;
}

interface ResetTokenRecord {
  email: string;
  tokenHash: string;
  expiresAt: number;
  used: boolean;
}

const credentialStore = new Map<string, StoredCredential>();
const resetTokenStore = new Map<string, ResetTokenRecord>(); // keyed by email (1 active token per account)

/**
 * Hashes a password using scrypt with a unique 16-byte cryptographic salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto
    .scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_PARAMS)
    .toString("hex");
  return `scrypt$${salt}$${derived}`;
}

/**
 * Constant-time password verification against a stored scrypt hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;

  try {
    const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_PARAMS);
    const expected = Buffer.from(expectedHex, "hex");
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function hasUserCredential(email: string): boolean {
  return credentialStore.has(email.toLowerCase());
}

export function getUserCredential(email: string): StoredCredential | undefined {
  return credentialStore.get(email.toLowerCase());
}

export function registerUserCredential(
  email: string,
  name: string,
  password: string
): StoredCredential {
  const normalized = email.toLowerCase();
  const record: StoredCredential = {
    email: normalized,
    name,
    passwordHash: hashPassword(password),
    role: "student",
    createdAt: Date.now(),
  };
  credentialStore.set(normalized, record);
  return record;
}

export function verifyUserCredential(
  email: string,
  password: string
): StoredCredential | null {
  const normalized = email.toLowerCase();
  const existing = credentialStore.get(normalized);
  if (!existing) {
    // Perform dummy scrypt work to mitigate user-enumeration timing differences
    crypto.scryptSync(password, "00000000000000000000000000000000", SCRYPT_KEYLEN, SCRYPT_PARAMS);
    return null;
  }
  return verifyPassword(password, existing.passwordHash) ? existing : null;
}

export function updateUserPassword(email: string, newPassword: string): boolean {
  const normalized = email.toLowerCase();
  const existing = credentialStore.get(normalized);
  if (!existing) return false;
  existing.passwordHash = hashPassword(newPassword);
  credentialStore.set(normalized, existing);
  return true;
}

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Generates a short-lived (default 15 min), strictly single-use password reset token.
 * Stores only the SHA-256 digest of the token in memory.
 */
export function createPasswordResetToken(
  email: string,
  ttlMs = DEFAULT_RESET_TTL_MS
): { token: string; expiresAt: number } {
  const normalized = email.toLowerCase();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + ttlMs;

  resetTokenStore.set(normalized, {
    email: normalized,
    tokenHash: sha256Hex(rawToken),
    expiresAt,
    used: false,
  });

  return { token: rawToken, expiresAt };
}

/**
 * Validates and atomically consumes a single-use password reset token.
 * Returns the associated email on success, or null if invalid, expired, or already used.
 */
export function consumePasswordResetToken(rawToken: string): string | null {
  if (!rawToken || typeof rawToken !== "string" || rawToken.length < 32) {
    return null;
  }

  const candidateHash = Buffer.from(sha256Hex(rawToken), "hex");
  const now = Date.now();

  for (const [email, record] of Array.from(resetTokenStore.entries())) {
    if (record.expiresAt <= now || record.used) {
      resetTokenStore.delete(email);
      continue;
    }

    const storedHash = Buffer.from(record.tokenHash, "hex");
    if (
      storedHash.length === candidateHash.length &&
      crypto.timingSafeEqual(storedHash, candidateHash)
    ) {
      record.used = true;
      resetTokenStore.delete(email);
      return record.email;
    }
  }

  return null;
}

export function resetSecurityStoresForTests(): void {
  credentialStore.clear();
  resetTokenStore.clear();
}
