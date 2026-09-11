import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

// Rate limiting: Consider adding edge-level rate limiting (e.g., Vercel Edge rate limit
// or a custom sliding-window counter) to protect against brute-force auth attempts.
// The middleware validates auth sessions on every non-static request via updateSession().

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // manifest.json is excluded on purpose: browsers fetch the web app manifest
  // without credentials, so the auth guard saw every request as anonymous and
  // redirected it to /register. Chrome then had no manifest to install from.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|api/|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
