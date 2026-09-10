import Link from 'next/link'
import { ChevronLeft, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SubjectIcon } from '../subject-icon'
import { DEFAULT_SUBJECTS, OPTIONAL_SUBJECTS } from '../subjects'
import { fetchLecturesPage, LECTURES_PAGE_SIZE } from '../lecture-queries'
import { LectureList } from './lecture-list'

export const dynamic = 'force-dynamic'

export default async function SubjectLecturesPage({
  params,
}: {
  params: Promise<{ subject: string }>
}) {
  const { subject: rawSubject } = await params
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

  const { items, hasMore } = classNumber
    ? await fetchLecturesPage(supabase, classNumber, subject, 0)
    : { items: [], hasMore: false }

  const subjectInfo = [...DEFAULT_SUBJECTS, ...OPTIONAL_SUBJECTS].find((s) => s.name === subject)

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      <Link
        href="/lectures"
        className="text-sm text-[#7c5cfc] flex items-center gap-1 hover:gap-2 transition-all font-medium w-fit"
      >
        <ChevronLeft className="w-4 h-4" /> Svi predmeti
      </Link>

      <div className="flex items-center gap-4">
        {subjectInfo && (
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <SubjectIcon name={subjectInfo.name} emoji={subjectInfo.emoji} size="lg" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{subject}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {items.length}
            {hasMore ? '+' : ''} lekcija
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="w-16 h-16 rounded-3xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 opacity-30" />
          </div>
          <p className="text-sm">Nema lekcija za ovaj predmet</p>
        </div>
      ) : (
        <LectureList
          subject={subject}
          classNumber={classNumber!}
          initialItems={items}
          initialHasMore={hasMore}
          pageSize={LECTURES_PAGE_SIZE}
        />
      )}
    </div>
  )
}
