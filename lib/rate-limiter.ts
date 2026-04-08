/**
 * Simple in-memory rate limiter
 * Tracks requests by IP/identifier and enforces limits
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

/**
 * Check if a request should be rate-limited
 * @param identifier - IP address or user identifier
 * @param limit - Max requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if request is allowed, false if rate-limited
 */
export function isRateLimited(
  identifier: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now >= entry.resetAt) {
    // Reset or create new entry
    store.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return false; // Allow request
  }

  if (entry.count < limit) {
    entry.count++;
    return false; // Allow request
  }

  return true; // Reject request (rate-limited)
}

/**
 * Get remaining attempts for an identifier
 */
export function getRemainingAttempts(
  identifier: string,
  limit: number,
  windowMs: number
): number {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now >= entry.resetAt) {
    return limit;
  }

  return Math.max(0, limit - entry.count);
}

/**
 * Get reset time for an identifier
 */
export function getResetTime(
  identifier: string,
  windowMs: number
): number | null {
  const entry = store.get(identifier);
  if (!entry) {
    return null;
  }

  const now = Date.now();
  if (now >= entry.resetAt) {
    return null; // Already reset
  }

  return entry.resetAt;
}

/**
 * Cleanup old entries (call periodically to prevent memory leak)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

// Cleanup every 5 minutes
setInterval(() => {
  cleanupExpiredEntries();
}, 5 * 60 * 1000);
