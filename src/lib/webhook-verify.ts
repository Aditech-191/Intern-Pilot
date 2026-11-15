import crypto from "crypto";

/**
 * Webhook Signature Verification
 * Uses constant-time buffer comparison to prevent timing attacks when verifying external webhooks.
 */
export function verifyHmacSignature(
  payload: string,
  signatureHeader: string,
  secret: string
): boolean {
  if (!payload || !signatureHeader || !secret) {
    return false;
  }

  try {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from("sha256=" + hmac.update(payload).digest("hex"), "utf8");
    const checksum = Buffer.from(signatureHeader, "utf8");

    if (checksum.length !== digest.length) {
      return false;
    }

    return crypto.timingSafeEqual(digest, checksum);
  } catch {
    return false;
  }
}

