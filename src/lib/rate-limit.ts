/**
 * Lightweight in-memory rate limiter.
 * Uses a Map to track request timestamps per key (e.g. IP + action).
 * No external dependencies required.
 */

interface RateLimitOptions {
  /** Max requests allowed within the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

// Store: key → array of request timestamps
const store = new Map<string, number[]>();

/**
 * Returns true if the request is allowed, false if it should be rate-limited.
 * @param key   Unique identifier, e.g. `${ip}:login`
 * @param opts  Rate limit configuration
 */
export function checkRateLimit(key: string, opts: RateLimitOptions): boolean {
  const now = Date.now();
  const windowStart = now - opts.windowMs;

  // Get existing timestamps for this key, filter out expired ones
  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= opts.limit) {
    // Store updated (cleaned) list and reject
    store.set(key, timestamps);
    return false;
  }

  // Allow — record this timestamp
  timestamps.push(now);
  store.set(key, timestamps);
  return true;
}

/**
 * Extract the client IP from a Next.js Request.
 * Falls back to 'unknown' if headers are not present.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') ?? 'unknown';
}
