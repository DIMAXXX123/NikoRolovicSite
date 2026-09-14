/**
 * Single source of truth for which pages are reachable without a session.
 * Shared by the middleware guard and the client-side ProfileGuard so the two
 * cannot drift apart.
 */

/** Sign-in / sign-up flows. A signed-in user gets bounced out of these. */
export const AUTH_PATHS = [
  '/login',
  '/register',
  '/verify',
  '/reset-password',
  '/update-password',
] as const

/** Legal pages that must stay readable for everyone. */
export const LEGAL_PATHS = ['/privacy', '/terms', '/content-policy'] as const

/** Everything an anonymous visitor may open ('/' only redirects onwards). */
export const PUBLIC_PATHS = ['/', ...AUTH_PATHS, ...LEGAL_PATHS] as const

export function pathMatches(pathname: string, paths: readonly string[]): boolean {
  return paths.some((p) => pathname === p || (p !== '/' && pathname.startsWith(`${p}/`)))
}
