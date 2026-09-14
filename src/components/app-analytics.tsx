'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { firstTimeThisSession, flush, sessionSeconds, track } from '@/lib/analytics'

/**
 * Session-level telemetry, mounted once in the root layout. Renders nothing.
 *
 * - app_open + session_start: first mount of a tab session
 * - screen_view: every pathname change (meta.path)
 * - session_end: on pagehide, value = seconds since the session started
 */
export function AppAnalytics() {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (firstTimeThisSession('session')) {
      track('app_open')
      track('session_start')
    }
    const onHide = () => {
      track('session_end', { value: sessionSeconds() })
      flush(true)
    }
    window.addEventListener('pagehide', onHide)
    return () => window.removeEventListener('pagehide', onHide)
  }, [])

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return
    lastPath.current = pathname
    track('screen_view', { meta: { path: pathname } })
  }, [pathname])

  return null
}
