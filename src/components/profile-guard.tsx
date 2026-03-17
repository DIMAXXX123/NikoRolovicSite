'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function ProfileGuard() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      // Check via server API (bypasses RLS)
      try {
        const res = await fetch('/api/check-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
        const { exists } = await res.json()
        
        if (!exists) {
          await supabase.auth.signOut()
          router.replace('/login')
        }
      } catch {}
    }

    // Check immediately
    check()

    // Re-check every 15 seconds
    const interval = setInterval(check, 15000)
    return () => clearInterval(interval)
  }, [])

  return null
}
