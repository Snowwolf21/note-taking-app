/**
 * Lightweight in-memory rate limiter with automatic stale key pruning.
 * Tracks request timestamps per key (e.g. IP + action).
 */

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

const store = new Map<string, number[]>();

/**
 * Periodically prunes expired entries to prevent memory leaks.
 */
function pruneStore() {
  const now = Date.now();
  for (const [key, timestamps] of store.entries()) {
    const validTimestamps = timestamps.filter((t) => t > now - 3600_000);
    if (validTimestamps.length === 0) {
      store.delete(key);
    } else {
      store.set(key, validTimestamps);
    }
  }
}

// Prune stale IP entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(pruneStore, 10 * 60 * 1000).unref?.();
}

/**
 * Returns true if the request is allowed, false if rate limited.
 */
export function checkRateLimit(key: string, opts: RateLimitOptions): boolean {
  const now = Date.now();
  const windowStart = now - opts.windowMs;

  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= opts.limit) {
    store.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  store.set(key, timestamps);
  return true;
}

/**
 * Extract client IP securely.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp && firstIp !== '::1' && firstIp !== '127.0.0.1') {
      return firstIp;
    }
  }
  return req.headers.get('x-real-ip') ?? '127.0.0.1';
}

