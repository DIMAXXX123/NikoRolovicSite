'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * DEMO MODE: every visitor is signed in automatically as the shared
 * administrator account "Dmitrij Ivashchenko" — no registration, full admin
 * rights. Set DEMO_AUTO_ADMIN to false to return to normal login.
 */
export const DEMO_AUTO_ADMIN = true
const DEMO_EMAIL = 'demo-admin@nikorolovic.app'
const DEMO_PASSWORD = 'Demo-Eo4mqBPYkd8aW8z6TbLOr2Fw'

export function AutoLogin() {
  useEffect(() => {
    if (!DEMO_AUTO_ADMIN) return
    let cancelled = false
    const supabase = createClient()
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session || cancelled) return
      const { error } = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD })
      // First visit only: reload so every page (client fetches included) sees the session.
      if (!error && !cancelled) window.location.reload()
    })()
    return () => { cancelled = true }
  }, [])

  return null
}
