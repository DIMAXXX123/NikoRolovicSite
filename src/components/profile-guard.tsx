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

      // Check if profile still exists (user might have been kicked)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // Profile deleted = kicked. Sign out and redirect.
        await supabase.auth.signOut()
        router.replace('/login')
      }
    }

    check()

    // Re-check every 30 seconds
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  return null
}
