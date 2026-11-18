/**
 * Server-Side Input Sanitization and Boundary Validation
 * Prevents Cross-Site Scripting (XSS), script injection, and payload overflow attacks.
 */

/**
 * Escapes/strips potentially dangerous HTML, script tags, SVG/object payloads, and URI schemes.
 * Runs iteratively so nested bypasses like <scr<script>ipt> cannot reconstruct dangerous tags.
 */
export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== "string") return "";

  // Strip null bytes & control chars (except newlines/tabs) and truncate to prevent memory starvation
  let cleaned = input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);

  let previous = "";
  let iterations = 0;
  while (cleaned !== previous && iterations < 5) {
    previous = cleaned;
    iterations += 1;
    cleaned = cleaned
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
      .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, "")
      .replace(/<embed\b[^>]*>/gi, "")
      .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<\/?(script|iframe|object|embed|svg|style)\b[^>]*>/gi, "")
      .replace(/javascript\s*:/gi, "")
      .replace(/vbscript\s*:/gi, "")
      .replace(/data\s*:\s*text\/html/gi, "")
      .replace(/\bon[a-z]+\s*=/gi, "");
  }

  return cleaned.trim();
}

/**
 * Validates and normalizes email addresses.
 */
export function sanitizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const clean = email.trim().toLowerCase();

  // Require valid local part and domain with at least one dot + TLD
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  if (!emailRegex.test(clean) || clean.length > 254 || clean.includes("..")) {
    return null;
  }
  return clean;
}

/**
 * Sanitizes long text (e.g. pasted WhatsApp / LinkedIn listing) up to 25,000 characters.
 */
export function sanitizeOpportunityText(text: unknown): string {
  return sanitizeString(text, 25000);
}

/**
 * Sanitizes chat messages up to 2,000 characters.
 */
export function sanitizeChatMessage(message: unknown): string {
  return sanitizeString(message, 2000);
}

