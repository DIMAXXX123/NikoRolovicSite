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
        className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all w-fit"
      >
        <ChevronLeft className="w-4 h-4" /> Nazad
      </Link>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {lecture.subject}
            </Badge>
            {isCurrent && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 animate-pulse flex items-center gap-1">
                <Zap className="w-3 h-3" /> Trenutna lekcija
              </span>
            )}
          </div>
          <LectureLikeButton lectureId={lecture.id} />
        </div>

        <h1 className="text-2xl font-bold leading-tight">{formatMath(lecture.title)}</h1>

        {order.length > 1 && index >= 0 && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              Lekcija {index + 1} od {order.length}
            </p>
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7c5cfc] to-[#5b3fd9] rounded-full transition-all duration-500"
                style={{ width: `${((index + 1) / order.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
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
            <Link
              href={`${subjectHref}/${prevId}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Prethodna
            </Link>
          ) : (
            <span />
          )}
          {nextId && (
            <Link
              href={`${subjectHref}/${nextId}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors ml-auto"
            >
              Sljedeća <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
