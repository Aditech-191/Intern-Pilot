/**
 * In-Memory Sliding-Window Rate Limiter
 * Suitable for serverless / edge route protection against brute force and DDoS.
 * In a distributed multi-region cluster, replace the map store with Upstash Redis / KV.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const MAX_STORE_ENTRIES = 10000;
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale keys periodically every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      if (record.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    });
  }, 5 * 60 * 1000);
  if (typeof timer === "object" && "unref" in timer && typeof timer.unref === "function") {
    timer.unref();
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Checks and increments rate limit for an identifier (e.g. IP address or userId).
 * @param key Unique identifier (e.g., `login:${ip}` or `ai:${userId}`)
 * @param limit Maximum allowed requests within the window
 * @param windowSeconds Duration of the rate window in seconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    // Cap memory usage against distributed random-IP flood attacks
    if (rateLimitStore.size >= MAX_STORE_ENTRIES) {
      const oldestKey = rateLimitStore.keys().next().value;
      if (oldestKey) rateLimitStore.delete(oldestKey);
    }

    // New or expired window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetInSeconds: windowSeconds,
    };
  }

  // Active window
  if (existing.count >= limit) {
    const resetInSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetInSeconds: Math.max(1, resetInSeconds),
    };
  }

  existing.count += 1;
  const resetInSeconds = Math.ceil((existing.resetAt - now) / 1000);
  return {
    allowed: true,
    limit,
    remaining: limit - existing.count,
    resetInSeconds: Math.max(1, resetInSeconds),
  };
}

/**
 * Extracts client IP from standard reverse-proxy headers (Cloudflare, Vercel, Nginx).
 */
export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    // First IP in comma-separated list is the client IP
    return xForwardedFor.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

