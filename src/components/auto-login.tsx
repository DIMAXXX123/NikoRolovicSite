'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEMO_ACCOUNTS, DEMO_PASSWORD, readDemoRole } from '@/lib/demo-accounts'
import { DEMO_AUTO_ADMIN } from '@/lib/demo'

export { DEMO_AUTO_ADMIN }

/**
 * DEMO MODE: a visitor without a session is signed into the demo account of the
 * experience chosen on Još (učenik by default) and the page reloads once.
 * Set DEMO_AUTO_ADMIN (src/lib/demo.ts) to false to return to normal login.
 */
export function AutoLogin() {
  useEffect(() => {
    if (!DEMO_AUTO_ADMIN) return
    let cancelled = false
    const supabase = createClient()
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session || cancelled) return
      const account = DEMO_ACCOUNTS[readDemoRole()]
      const { error } = await supabase.auth.signInWithPassword({ email: account.email, password: DEMO_PASSWORD })
      // First visit only: reload so every page (client fetches included) sees the session.
      if (!error && !cancelled) window.location.reload()
    })()
    return () => { cancelled = true }
  }, [])

  return null
}
