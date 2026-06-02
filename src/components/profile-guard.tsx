'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function ProfileGuard() {
  const supabase = createClient()
  const router = useRouter()

  // Auth guard disabled — allow everyone in without login
  // useEffect(() => { ... }, [])

  return null
}
