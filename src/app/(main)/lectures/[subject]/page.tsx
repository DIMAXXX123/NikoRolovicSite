import Link from 'next/link'
import { ChevronLeft, BookOpen, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SubjectIcon } from '../subject-icon'
import { DEFAULT_SUBJECTS, OPTIONAL_SUBJECTS } from '../subjects'
import { fetchLecturesPage, LECTURES_PAGE_SIZE } from '../lecture-queries'
import { LectureList } from './lecture-list'

export const dynamic = 'force-dynamic'

export default async function SubjectLecturesPage({
  params,
  searchParams,
}: {
  params: Promise<{ subject: string }>
  searchParams: Promise<{ razred?: string }>
}) {
  const { subject: rawSubject } = await params
  const { razred } = await searchParams
  const subject = decodeURIComponent(rawSubject)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let classNumber: number | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('class_number')
      .eq('id', user.id)
      .single()
    classNumber = profile?.class_number ?? null
  }
  // Visitors without a profile browse by class (chips below); default 2. razred.
  const hasProfileClass = classNumber !== null
  if (classNumber === null) {
    const picked = Number(razred)
    classNumber = picked >= 1 && picked <= 4 ? picked : 2
  }

  const { items, hasMore } = await fetchLecturesPage(supabase, classNumber, subject, 0)

  const subjectInfo = [...DEFAULT_SUBJECTS, ...OPTIONAL_SUBJECTS].find((s) => s.name === subject)

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      <Link
        href="/lectures"
        className="inline-flex items-center gap-1 h-11 text-[13px] font-extrabold uppercase tracking-[0.04em] text-secondary w-fit hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-lg"
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={2.6} /> Svi predmeti
      </Link>

      <div className="flex items-center gap-4">
        {subjectInfo && (
          <SubjectIcon name={subjectInfo.name} emoji={subjectInfo.emoji} size="lg" />
        )}
        <div>
          <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading">
            {subject}
          </h1>
          <p className="text-[13px] font-bold text-muted-foreground mt-0.5">
            {items.length}
            {hasMore ? '+' : ''} lekcija
          </p>
        </div>
      </div>

      {!hasProfileClass && (
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((n) => (
            <Link
              key={n}
              href={`/lectures/${encodeURIComponent(subject)}?razred=${n}`}
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

      <Link
        href={`/lectures/nova?subject=${encodeURIComponent(subject)}`}
        className="flex items-center justify-center gap-2 h-[50px] px-5 rounded-2xl border-2 border-border bg-card text-secondary text-[15px] font-extrabold uppercase tracking-[0.04em] shadow-[0_4px_0_var(--color-border)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[4px] active:shadow-none"
      >
        <Sparkles className="w-5 h-5" strokeWidth={2.6} /> Nova lekcija sa AI
      </Link>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-disabled" strokeWidth={2.4} />
          </div>
          <p className="text-[17px] font-extrabold text-foreground">Nema lekcija za ovaj predmet</p>
        </div>
      ) : (
        <LectureList
          subject={subject}
          classNumber={classNumber}
          initialItems={items}
          initialHasMore={hasMore}
          pageSize={LECTURES_PAGE_SIZE}
        />
      )}
    </div>
  )
}
