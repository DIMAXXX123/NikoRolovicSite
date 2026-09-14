import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BookOpen, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { parseHomework } from '../../lectures/lecture-utils'
import { HomeworkCard } from '../../lectures/[subject]/[id]/homework-card'
import { SubjectIcon } from '../../lectures/subject-icon'
import { DEFAULT_SUBJECTS, OPTIONAL_SUBJECTS } from '../../lectures/subjects'

export const dynamic = 'force-dynamic'

/** One homework on its own page: the full card (photos, tasks, hints, done toggle) + its lecture. */
export default async function DomaciDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: lecture } = await supabase.from('lectures').select('id, subject, title, class_number, content').eq('id', id).maybeSingle()
  if (!lecture) notFound()
  const homework = parseHomework(lecture.content as string)
  if (!homework) notFound()
  const info = [...DEFAULT_SUBJECTS, ...OPTIONAL_SUBJECTS].find((s) => s.name === lecture.subject)

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      <Link
        href="/domaci"
        className="inline-flex items-center gap-1 h-11 text-[13px] font-extrabold uppercase tracking-[0.04em] text-secondary w-fit hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-lg"
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={2.6} /> Svi domaći
      </Link>

      <div className="flex items-center gap-4">
        {info && <SubjectIcon name={info.name} emoji={info.emoji} size="lg" />}
        <div className="min-w-0">
          <p className="text-[12px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{lecture.subject} · {lecture.class_number}. razred</p>
          <h1 className="mt-1.5 text-[22px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading">{lecture.title}</h1>
        </div>
      </div>

      <HomeworkCard lectureId={lecture.id} homework={homework} />

      <Link
        href={`/lectures/${encodeURIComponent(lecture.subject)}/${lecture.id}`}
        className="flex items-center justify-center gap-2 h-[50px] px-5 rounded-2xl bg-primary text-primary-foreground text-[15px] font-extrabold uppercase tracking-[0.04em] shadow-[0_4px_0_var(--color-primary-dark)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[4px] active:shadow-none"
      >
        <BookOpen className="w-5 h-5" strokeWidth={2.6} /> Otvori lekciju
      </Link>
    </div>
  )
}
