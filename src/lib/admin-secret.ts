import { timingSafeEqual } from 'node:crypto'

/**
 * Constant-time comparison of a caller-supplied secret against ADMIN_SECRET.
 * Returns false when the env variable is not configured.
 */
export function adminSecretMatches(provided: string): boolean {
  const expected = process.env.ADMIN_SECRET
  if (!expected) return false

  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false

  return timingSafeEqual(a, b)
}
