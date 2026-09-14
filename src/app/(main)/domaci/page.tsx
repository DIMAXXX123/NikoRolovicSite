import Link from 'next/link'
import { ClipboardList, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { parseHomework } from '../lectures/lecture-utils'
import type { HomeworkItem } from '../lectures/homework-block'
import { HomeworkList } from './homework-list'

export const dynamic = 'force-dynamic'

/** Loads every homework (lectures carrying a HOMEWORK block) for one class, newest first. */
export async function loadHomework(classNumber: number, limit = 60): Promise<HomeworkItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lectures')
    .select('id, subject, title, content, created_at')
    .eq('class_number', classNumber)
    .ilike('content', '%HOMEWORK:%')
    .order('created_at', { ascending: false })
    .limit(limit)
  return ((data ?? []) as { id: string; subject: string; title: string; content: string }[])
    .map((row) => ({ lectureId: row.id, subject: row.subject, title: row.title, homework: parseHomework(row.content) }))
    .filter((x): x is HomeworkItem => !!x.homework)
}

export default async function DomaciPage({ searchParams }: { searchParams: Promise<{ razred?: string }> }) {
  const { razred } = await searchParams
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  let classNumber: number | null = null
  if (session?.user) {
    const { data: profile } = await supabase.from('profiles').select('class_number').eq('id', session.user.id).single()
    classNumber = profile?.class_number ?? null
  }
  const hasProfileClass = classNumber !== null
  if (classNumber === null) {
    const picked = Number(razred)
    classNumber = picked >= 1 && picked <= 4 ? picked : 2
  }

  const today = new Date().toISOString().slice(0, 10)
  const items = (await loadHomework(classNumber)).sort((a, b) => {
    // Upcoming first (soonest due), then without a due date, then past.
    const rank = (d: string | null) => (d === null ? 1 : d >= today ? 0 : 2)
    const ra = rank(a.homework.due), rb = rank(b.homework.due)
    if (ra !== rb) return ra - rb
    return (a.homework.due ?? '').localeCompare(b.homework.due ?? '') * (ra === 2 ? -1 : 1)
  })

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      <div className="pt-1 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#C79000]" strokeWidth={2.6} /> Domaći
          </h1>
          <p className="text-[13px] font-bold text-muted-foreground mt-1">{classNumber}. razred · zadaci uz lekcije</p>
        </div>
      </div>

      {!hasProfileClass && (
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((n) => (
            <Link
              key={n}
              href={`/domaci?razred=${n}`}
              aria-current={classNumber === n ? 'page' : undefined}
              className={`h-11 rounded-xl border-2 text-[12px] font-extrabold uppercase tracking-[0.04em] flex items-center justify-center transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none ${
                classNumber === n
                  ? 'border-secondary-light-border bg-secondary-light text-secondary shadow-[0_2px_0_var(--color-secondary-light-border)]'
                  : 'border-border bg-card text-muted-foreground shadow-[0_2px_0_var(--color-border)]'
              }`}
            >
              {n}. razred
            </Link>
          ))}
        </div>
      )}

      <HomeworkList items={items} today={today} />

      <Link
        href="/lectures/nova"
        className="flex items-center justify-center gap-2 h-[50px] px-5 rounded-2xl border-2 border-border bg-card text-secondary text-[15px] font-extrabold uppercase tracking-[0.04em] shadow-[0_4px_0_var(--color-border)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[4px] active:shadow-none"
      >
        <Sparkles className="w-5 h-5" strokeWidth={2.6} /> Dodaj domaći uz lekciju
      </Link>
    </div>
  )
}
