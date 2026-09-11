import type { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Rate limiting backed by the shared `rate_limits` table in Supabase
 * (see supabase/migrations/20260910000400_rate_limits.sql).
 *
 * The previous implementation kept counters in a per-process Map, which does
 * nothing on Vercel: every serverless instance had its own Map, so an attacker
 * only had to spread requests across instances. Counters now live in Postgres
 * and are bumped through the consume_rate_limit() function, so every instance
 * shares one fixed window. Expired rows are swept by that function.
 */

export interface RateLimitResult {
  limited: boolean
  /** Seconds until the current window ends — used for Retry-After. */
  retryAfter: number
}

const ALLOWED: RateLimitResult = { limited: false, retryAfter: 0 }

/**
 * Counts one hit against `key` and reports whether the caller is over budget.
 *
 * If the shared store is unreachable the request is allowed through (the
 * portal staying usable beats blocking every login on a database hiccup) and
 * the failure is logged.
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const windowSeconds = Math.max(1, Math.round(windowMs / 1000))

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase.rpc('consume_rate_limit', {
      p_key: key,
      p_max: maxRequests,
      p_window_seconds: windowSeconds,
    })

    if (error) {
      console.error('rate-limit: consume_rate_limit failed', error.message)
      return ALLOWED
    }

    const result = data as { allowed?: boolean; reset_at?: string } | null
    if (!result || result.allowed !== false) return ALLOWED

    const resetAt = result.reset_at ? Date.parse(result.reset_at) : NaN
    const retryAfter = Number.isNaN(resetAt)
      ? windowSeconds
      : Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))

    return { limited: true, retryAfter }
  } catch (err) {
    console.error('rate-limit: store unavailable', err)
    return ALLOWED
  }
}

/** Best-effort client IP for rate limit keys. */
export function clientIp(req: Request | NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || req.headers.get('x-real-ip')?.trim() || 'unknown'
}
