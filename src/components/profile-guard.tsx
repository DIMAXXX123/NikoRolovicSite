'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { PUBLIC_PATHS, pathMatches } from '@/lib/public-paths'
import { DEMO_AUTO_ADMIN } from '@/lib/demo'

/**
 * Client-side companion to the middleware auth guard: it also catches the case
 * where the session is still valid but the profile row is gone (deleted or
 * kicked user), and reacts to a session that expires while the tab is open.
 */
export function ProfileGuard() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  // privacy / terms / content-policy live in the same layout but must stay
  // readable without a session.
  const isPublicPage = pathMatches(pathname ?? '/', PUBLIC_PATHS)

  useEffect(() => {
    // Demo mode: the site is open and <AutoLogin /> owns the session —
    // never bounce a visitor to /login or sign the shared account out.
    if (DEMO_AUTO_ADMIN || isPublicPage) return
    let cancelled = false

    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return

      if (!user) {
        router.replace('/login')
        return
      }

      // Check via server API (profiles is not readable without a session)
      try {
        const res = await fetch('/api/check-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
        const { exists } = await res.json()

        if (!exists && !cancelled) {
          await supabase.auth.signOut()
          router.replace('/login')
        }
      } catch {}
    }

    check()

    // Re-check periodically so a revoked account loses access without a reload.
    const interval = setInterval(check, 60_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [router, supabase, isPublicPage])

  return null
}
