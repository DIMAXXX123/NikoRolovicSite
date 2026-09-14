/**
 * DEMO MODE switch (shared by the client <AutoLogin />, the middleware and
 * the client-side ProfileGuard so the three cannot drift apart).
 *
 * While true the site is open to everyone: no redirects to /login, and every
 * visitor is signed in automatically as the shared demo administrator
 * (see src/components/auto-login.tsx). Set to false to restore normal auth.
 */
export const DEMO_AUTO_ADMIN = true
