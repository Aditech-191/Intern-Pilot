/**
 * Server-Side Input Sanitization and Boundary Validation
 * Prevents Cross-Site Scripting (XSS), script injection, and payload overflow attacks.
 */

/**
 * Escapes potentially dangerous HTML and script tags from text inputs.
 */
export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== "string") return "";

  // Truncate to maximum permissible length to prevent memory starvation
  const trimmed = input.trim().slice(0, maxLength);

  // Strip or neutralize dangerous script tags, event handlers, and iframe injection
  return trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

/**
 * Validates and normalizes email addresses.
 */
export function sanitizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const clean = email.trim().toLowerCase();
  
  // RFC 5322 standard email validation regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  if (!emailRegex.test(clean) || clean.length > 254) {
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

