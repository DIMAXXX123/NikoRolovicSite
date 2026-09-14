import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { formatMath, getYouTubeId, parseLectureDate, parseQuizData } from '../../lecture-utils'
import { fetchLectureOrder } from '../../lecture-queries'
import { LectureContent } from './lecture-content'
import { LectureTabs } from './lecture-tabs'
import { LectureLikeButton } from './lecture-like-button'
import type { Lecture } from '@/lib/types'

export const dynamic = 'force-dynamic'

const NAV_LINK_CLASS =
  'inline-flex items-center justify-center gap-1 h-11 px-4 rounded-xl border-2 border-border bg-background text-[13px] font-extrabold uppercase tracking-[0.04em] text-secondary shadow-[0_2px_0_var(--color-border)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

export default async function LectureDetailPage({
  params,
}: {
  params: Promise<{ subject: string; id: string }>
}) {
  const { subject: rawSubject, id } = await params
  const subject = decodeURIComponent(rawSubject)
  const subjectHref = `/lectures/${encodeURIComponent(subject)}`

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: lectureData }, profileRes] = await Promise.all([
    supabase.from('lectures').select('*').eq('id', id).single(),
    user
      ? supabase.from('profiles').select('class_number, section_number').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ])

  const lecture = lectureData as Lecture | null
  if (!lecture) notFound()

  const profile = profileRes.data as { class_number: number; section_number: number } | null

  const order = await fetchLectureOrder(supabase, lecture.class_number, lecture.subject)
  const index = order.indexOf(lecture.id)
  const prevId = index > 0 ? order[index - 1] : null
  const nextId = index >= 0 && index < order.length - 1 ? order[index + 1] : null

  const quizData = parseQuizData(lecture.content)
  const isCurrent = lecture.content.includes('<!-- CURRENT -->')
  const lectureDate = parseLectureDate(lecture.content)
  const videoId = lecture.video_url ? getYouTubeId(lecture.video_url) : null

  return (
    <div className="space-y-4 animate-fade-in">
      <Link
        href={subjectHref}
        className="inline-flex items-center gap-1 h-11 text-[13px] font-extrabold uppercase tracking-[0.04em] text-secondary w-fit hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-lg"
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={2.6} /> Nazad
      </Link>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{lecture.subject}</Badge>
            {isCurrent && (
              <Badge>
                <Zap strokeWidth={2.6} /> Trenutna lekcija
              </Badge>
            )}
          </div>
          <LectureLikeButton lectureId={lecture.id} />
        </div>

        <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading">
          {formatMath(lecture.title)}
        </h1>

        {order.length > 1 && index >= 0 && (
          <div className="flex items-center gap-3">
            <p className="text-[13px] font-bold text-muted-foreground whitespace-nowrap">
              Lekcija {index + 1} od {order.length}
            </p>
            <div className="flex-1 h-4 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full shadow-[inset_0_4px_0_rgba(255,255,255,0.3)] transition-all duration-500"
                style={{ width: `${((index + 1) / order.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <p className="text-[13px] font-bold text-muted-foreground">
          {profile?.class_number}-{profile?.section_number} ·{' '}
          {lectureDate
            ? new Date(lectureDate).toLocaleDateString('sr-Latn')
            : new Date(lecture.created_at).toLocaleDateString('sr-Latn')}
        </p>
      </div>

      <LectureTabs
        title={lecture.title}
        videoUrl={lecture.video_url ?? null}
        videoId={videoId}
        questions={quizData?.questions ?? []}
        flashcards={quizData?.flashcards ?? []}
        content={<LectureContent content={lecture.content} />}
      />

      {(prevId || nextId) && (
        <div className="flex items-center justify-between gap-3 pt-2">
          {prevId ? (
            <Link href={`${subjectHref}/${prevId}`} className={NAV_LINK_CLASS}>
              <ChevronLeft className="w-4 h-4" strokeWidth={2.6} /> Prethodna
            </Link>
          ) : (
            <span />
          )}
          {nextId && (
            <Link href={`${subjectHref}/${nextId}`} className={`${NAV_LINK_CLASS} ml-auto`}>
              Sljedeća <ChevronRight className="w-4 h-4" strokeWidth={2.6} />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
