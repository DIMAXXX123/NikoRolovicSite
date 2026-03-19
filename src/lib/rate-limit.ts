const hits = new Map<string, { count: number; resetAt: number }>()

/**
 * Simple in-memory rate limiter.
 * Returns true if rate limit exceeded, false if allowed.
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = hits.get(key)

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  entry.count++
  if (entry.count > maxRequests) {
    return true
  }

  return false
}
