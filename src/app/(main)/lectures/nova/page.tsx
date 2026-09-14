import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { NovaLekcijaForm } from './nova-form'
import type { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

/** "Nova lekcija (AI)": anyone uploads photos, the worker turns them into a lecture. */
export default async function NovaLekcijaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('class_number').eq('id', user.id).single()
    profile = (data as Profile | null) ?? null
  }

  return (
    <Suspense>
      <NovaLekcijaForm userId={user?.id ?? null} defaultClass={profile?.class_number ?? null} />
    </Suspense>
  )
}
