import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { SubjectGrid } from './subject-grid'
import { HomeworkBlock, type HomeworkItem } from './homework-block'
import { parseHomework } from './lecture-utils'
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

  // Current homework for the visitor's class (visitors without a profile see 2. razred).
  const classNumber = profile?.class_number ?? 2
  const today = new Date().toISOString().slice(0, 10)
  const { data: hwRows } = await supabase
    .from('lectures')
    .select('id, subject, title, content')
    .eq('class_number', classNumber)
    .ilike('content', '%HOMEWORK:%')
    .order('created_at', { ascending: false })
    .limit(12)
  const homework: HomeworkItem[] = ((hwRows ?? []) as { id: string; subject: string; title: string; content: string }[])
    .map((row) => ({ lectureId: row.id, subject: row.subject, title: row.title, homework: parseHomework(row.content) }))
    .filter((x): x is HomeworkItem => !!x.homework && (!x.homework.due || x.homework.due >= today))
    .sort((a, b) => (a.homework.due ?? '9999').localeCompare(b.homework.due ?? '9999'))
    .slice(0, 4)

  return (
    <div className="space-y-5 animate-fade-in pb-4">

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

      <HomeworkBlock items={homework} />

      <Link
        href="/lectures/nova"
        className="flex items-center gap-3 min-h-16 px-4 py-3 rounded-2xl border-2 border-primary-light-border bg-[#F4FFEA] shadow-[0_2px_0_var(--color-primary-light-border)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none"
      >
        <span className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 shadow-[0_3px_0_var(--color-primary-dark)]">
          <Sparkles className="w-5 h-5" strokeWidth={2.6} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] leading-[1.3] font-extrabold text-heading">Nova lekcija sa AI</span>
          <span className="block text-[13px] leading-[1.4] font-bold text-muted-foreground">Slikaj udžbenik ili tablu — lekcija za par minuta</span>
        </span>
      </Link>

      <SubjectGrid />
    </div>
  )
}
