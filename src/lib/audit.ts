/**
 * Security & Administrative Action Audit Logging
 * Tracks security-relevant events (auth attempts, role modifications, rate limits).
 */

export type AuditEventType =
  | "AUTH_LOGIN_SUCCESS"
  | "AUTH_LOGIN_FAILURE"
  | "AUTH_LOGOUT"
  | "RATE_LIMIT_EXCEEDED"
  | "BOT_HONEYPOT_TRIGGERED"
  | "ADMIN_ACTION"
  | "PROFILE_UPDATED"
  | "IDOR_ATTEMPT_BLOCKED"
  | "CSRF_REJECTED"
  | "INVALID_SESSION_SIGNATURE"
  | "UNAUTHORIZED_ADMIN_ACCESS"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED";

export interface AuditLogEntry {
  timestamp: string;
  eventType: AuditEventType;
  actorId?: string;
  ip?: string;
  details?: Record<string, unknown>;
}

export function logAuditEvent(
  eventType: AuditEventType,
  data?: {
    actorId?: string;
    ip?: string;
    details?: Record<string, unknown>;
  }
) {
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    actorId: data?.actorId || "anonymous",
    ip: data?.ip || "unknown",
    details: data?.details,
  };

  // Structured JSON logging for cloud aggregators (Google Cloud Logging, Datadog, etc.)
  console.info(`[AUDIT_LOG] ${JSON.stringify(entry)}`);
}

