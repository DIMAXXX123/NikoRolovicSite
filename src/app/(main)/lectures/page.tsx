import { createClient } from '@/lib/supabase/server'
import { BetaDisclaimer } from '@/components/beta-disclaimer'
import { SubjectGrid } from './subject-grid'
import type { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function LecturesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = (data as Profile | null) ?? null
  }

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      <BetaDisclaimer />

      <div className="pt-1">
        <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading">
          Lekcije
        </h1>
        {profile && (
          <p className="text-[13px] font-bold text-muted-foreground mt-1">
            {profile.class_number}. razred, {profile.section_number}. odjeljenje
          </p>
        )}
      </div>

      <SubjectGrid />
    </div>
  )
}
