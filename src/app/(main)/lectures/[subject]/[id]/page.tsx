import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatMath, getYouTubeId, parseLectureDate, parseQuizData } from '../../lecture-utils'
import { fetchLectureOrder } from '../../lecture-queries'
import { LectureContent, lectureOutline, readingMinutes } from './lecture-content'
import { LectureReader, type LectureNeighbour } from './lecture-tabs'
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
  const { data: lectureData } = await supabase.from('lectures').select('*').eq('id', id).single()

  const lecture = lectureData as Lecture | null
  if (!lecture) notFound()

  const order = await fetchLectureOrder(supabase, lecture.class_number, lecture.subject)
  const index = order.indexOf(lecture.id)
  const prevId = index > 0 ? order[index - 1] : null
  const nextId = index >= 0 && index < order.length - 1 ? order[index + 1] : null

  // Titles for the prev/next rows — two ids at most, one cheap query.
  const neighbourIds = [prevId, nextId].filter((v): v is string => !!v)
  let prev: LectureNeighbour | null = null
  let next: LectureNeighbour | null = null
  if (neighbourIds.length > 0) {
    const { data } = await supabase.from('lectures').select('id, title').in('id', neighbourIds)
    const rows = (data ?? []) as LectureNeighbour[]
    prev = rows.find((r) => r.id === prevId) ?? null
    next = rows.find((r) => r.id === nextId) ?? null
  }

  const quizData = parseQuizData(lecture.content)
  const isCurrent = lecture.content.includes('<!-- CURRENT -->')
  const lectureDate = parseLectureDate(lecture.content)
  const videoId = lecture.video_url ? getYouTubeId(lecture.video_url) : null
  const dateSource = lectureDate ?? lecture.created_at
  const dateLabel = dateSource ? new Date(dateSource).toLocaleDateString('sr-Latn') : null

  return (
    <LectureReader
      lectureId={lecture.id}
      title={formatMath(lecture.title)}
      subject={lecture.subject}
      subjectHref={subjectHref}
      classNumber={lecture.class_number}
      readingMinutes={readingMinutes(lecture.content)}
      outline={lectureOutline(lecture.content)}
      isCurrent={isCurrent}
      dateLabel={dateLabel}
      lectureIndex={order.length > 1 && index >= 0 ? index : null}
      lectureCount={order.length}
      videoUrl={lecture.video_url ?? null}
      videoId={videoId}
      questions={quizData?.questions ?? []}
      flashcards={quizData?.flashcards ?? []}
      prev={prev}
      next={next}
      content={<LectureContent content={lecture.content} />}
    />
  )
}
