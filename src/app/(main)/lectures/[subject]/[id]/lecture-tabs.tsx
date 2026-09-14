'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  BookOpen,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  ListChecks,
  Play,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatMath, type FlashCard, type KeyTerm, type QuizQuestion } from '../../lecture-utils'
import { useLocalJson, writeLocalJson } from '@/lib/local-json'
import { track, trackOnce } from '@/lib/analytics'
import { syncLectureRead } from '@/lib/progress-sync'
import { LectureLikeButton } from './lecture-like-button'

// The quiz is a separate chunk — a reader who never opens it never downloads it.
const QuizRunner = dynamic(() => import('./quiz-runner').then((m) => m.QuizRunner), {
  loading: () => <div className="h-40 rounded-2xl skeleton" />,
})

// Header (64px) + sticky strip (44px) + breathing room — the line a section
// must cross to count as "current".
const READ_LINE = 120

/** Montenegrin plural: 1 → one, 2–4 → few, 5+ → many. */
function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  const word = mod10 === 1 && mod100 !== 11 ? one : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? few : many
  return `${n} ${word}`
}

/**
 * Per-device reading state, one JSON record per lecture: the last part the
 * reader reached (resume), whether the lecture was finished, and the last
 * quiz score in percent.
 */
interface LectureProgress {
  part: number
  done: boolean
  quiz: number | null
}
const NO_PROGRESS: LectureProgress = { part: 0, done: false, quiz: null }
const progressKey = (id: string) => `lecture_progress:${id}`

function readProgress(id: string): LectureProgress {
  try {
    const raw = localStorage.getItem(progressKey(id))
    return raw ? { ...NO_PROGRESS, ...(JSON.parse(raw) as Partial<LectureProgress>) } : NO_PROGRESS
  } catch {
    return NO_PROGRESS
  }
}

function saveProgress(id: string, patch: Partial<LectureProgress>) {
  const current = readProgress(id)
  const next = { ...current, ...patch }
  if (next.part === current.part && next.done === current.done && next.quiz === current.quiz) return
  try {
    writeLocalJson(progressKey(id), next)
  } catch {
    // Private mode / quota — progress is a convenience, not data.
  }
}

// ---------------------------------------------------------------------------
// Key terms — chips that reveal their definition on tap (blue tint callout).
// ---------------------------------------------------------------------------

export function KeyTermsChips({ terms }: { terms: KeyTerm[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const current = open !== null ? terms[open] : null

  return (
    <Card className="gap-3 border-secondary-light-border bg-[#F0F9FF] shadow-[0_2px_0_var(--color-secondary-light-border)] overflow-visible">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-secondary" strokeWidth={2.6} />
        <h3 className="text-[17px] font-extrabold leading-[1.3] text-heading">Ključni pojmovi</h3>
        <span className="ml-auto text-[13px] font-bold text-muted-foreground tabular-nums">{terms.length}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {terms.map((term, i) => {
          const selected = open === i
          return (
            <button
              key={i}
              type="button"
              aria-expanded={selected}
              onClick={() => setOpen(selected ? null : i)}
              className={`inline-flex items-center h-11 px-3.5 rounded-xl border-2 text-[13px] font-extrabold transition-[transform,box-shadow,background-color,border-color,color] duration-[80ms] active:translate-y-[2px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                selected
                  ? 'border-secondary bg-secondary text-[#FFFFFF] shadow-[0_2px_0_var(--color-secondary-dark)]'
                  : 'border-secondary-light-border bg-background text-secondary shadow-[0_2px_0_var(--color-secondary-light-border)]'
              }`}
            >
              {formatMath(term.term)}
            </button>
          )
        })}
      </div>
      {current ? (
        <div className="rounded-xl border-2 border-secondary-light-border bg-background px-4 py-3 animate-fade-in">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-secondary mb-1">
            {formatMath(current.term)}
          </p>
          <p className="text-[15px] font-bold text-foreground leading-[1.6]">{formatMath(current.definition)}</p>
        </div>
      ) : (
        <p className="text-[13px] font-bold text-muted-foreground">Tapni pojam da vidiš objašnjenje.</p>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Prev / next lecture rows (§4.10)
// ---------------------------------------------------------------------------

export interface LectureNeighbour {
  id: string
  title: string
}

function NeighbourRow({
  href,
  label,
  title,
  direction,
}: {
  href: string
  label: string
  title: string
  direction: 'prev' | 'next'
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight
  return (
    <Link
      href={href}
      className="min-h-16 px-4 py-3 rounded-2xl border-2 border-border bg-card shadow-[0_2px_0_var(--color-border)] flex items-center gap-3 transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {direction === 'prev' && (
        <span className="w-11 h-11 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-muted-foreground" strokeWidth={2.6} />
        </span>
      )}
      <div className={`min-w-0 flex-1 ${direction === 'prev' ? '' : 'text-right'}`}>
        <p className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{label}</p>
        <p className="text-[17px] font-extrabold leading-[1.3] text-heading truncate">{formatMath(title)}</p>
      </div>
      {direction === 'next' && (
        <span className="w-11 h-11 rounded-full bg-primary-light border-2 border-primary-light-border flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-primary-text" strokeWidth={2.6} />
        </span>
      )}
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Reader shell
// ---------------------------------------------------------------------------

export interface LectureReaderProps {
  lectureId: string
  title: string
  subject: string
  subjectHref: string
  classNumber: number
  readingMinutes: number
  /** Section headings in order — drives the outline card and "Dio n od N". */
  outline: string[]
  isCurrent: boolean
  dateLabel: string | null
  lectureIndex: number | null
  lectureCount: number
  videoUrl: string | null
  videoId: string | null
  questions: QuizQuestion[]
  flashcards: FlashCard[]
  prev: LectureNeighbour | null
  next: LectureNeighbour | null
  /** Lecture body, rendered on the server and handed over as markup. */
  content: ReactNode
}

type Section = 'content' | 'video' | 'quiz'
type PracticeMode = 'quiz' | 'flashcards'

export function LectureReader({
  lectureId,
  title,
  subject,
  subjectHref,
  classNumber,
  readingMinutes,
  outline,
  isCurrent,
  dateLabel,
  lectureIndex,
  lectureCount,
  videoUrl,
  videoId,
  questions,
  flashcards,
  prev,
  next,
  content,
}: LectureReaderProps) {
  const [activeSection, setActiveSection] = useState<Section>('content')
  const [practice, setPractice] = useState<PracticeMode | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentPart, setCurrentPart] = useState(0)
  const [passed, setPassed] = useState<boolean[]>(() => outline.map(() => false))
  const [resumeDismissed, setResumeDismissed] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const reachedEndRef = useRef(false)
  const interactedRef = useRef(false)
  const saved = useLocalJson<LectureProgress>(progressKey(lectureId), NO_PROGRESS)

  const hasVideo = !!videoUrl && !!videoId
  const hasQuiz = questions.length > 0
  const hasFlashcards = flashcards.length > 0
  const hasPractice = hasQuiz || hasFlashcards
  const showOutline = outline.length >= 3
  const partCount = outline.length
  const done = saved.done
  const resumePart = !resumeDismissed && saved.part > 0 && saved.part < partCount ? saved.part : null

  const markDone = useCallback(() => {
    if (!readProgress(lectureId).done) {
      track('lecture_read', { entity_id: lectureId, subject })
      syncLectureRead(lectureId, true)
    }
    saveProgress(lectureId, { done: true })
  }, [lectureId, subject])

  // One lecture_open per lecture per tab session; lecture_time on the way out.
  useEffect(() => {
    trackOnce(lectureId, 'lecture_open', { entity_id: lectureId, subject })
    const openedAt = Date.now()
    return () => {
      const seconds = Math.round((Date.now() - openedAt) / 1000)
      if (seconds >= 3) track('lecture_time', { entity_id: lectureId, subject, value: seconds })
    }
  }, [lectureId, subject])

  // Reading progress: scroll-based fill + which numbered part sits at the read line.
  useEffect(() => {
    if (activeSection !== 'content') return
    const body = bodyRef.current
    if (!body) return

    let frame = 0
    const measure = () => {
      frame = 0
      const rect = body.getBoundingClientRect()
      const top = rect.top + window.scrollY
      const start = top - READ_LINE
      const end = top + rect.height - window.innerHeight
      const p = end <= start ? 1 : Math.min(1, Math.max(0, (window.scrollY - start) / (end - start)))
      setProgress(p)

      const nodes = body.querySelectorAll<HTMLElement>('[data-lecture-section]')
      let current = 0
      const next: boolean[] = []
      nodes.forEach((node, i) => {
        const r = node.getBoundingClientRect()
        if (r.top <= READ_LINE) current = i
        next.push(r.bottom <= READ_LINE)
      })
      setCurrentPart(current)
      setPassed((prev) =>
        prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next
      )

      // Finished reading = the end of the body has actually been on screen.
      if (p >= 0.98 && rect.bottom <= window.innerHeight + 4 && !reachedEndRef.current) {
        reachedEndRef.current = true
        if (!hasQuiz || readProgress(lectureId).quiz !== null) markDone()
      }
    }
    const onScroll = () => {
      if (!interactedRef.current) {
        interactedRef.current = true
        setResumeDismissed(true)
      }
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [activeSection, practice, lectureId, hasQuiz, markDone])

  // Remember where the reader stopped so the next visit can resume there.
  useEffect(() => {
    if (activeSection !== 'content' || partCount === 0 || !interactedRef.current) return
    saveProgress(lectureId, { part: currentPart })
  }, [currentPart, activeSection, partCount, lectureId])

  function scrollToPart(index: number) {
    const node = bodyRef.current?.querySelector<HTMLElement>(`[data-lecture-section="${index}"]`)
    node?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setResumeDismissed(true)
  }

  function onQuizFinished(scorePct: number) {
    saveProgress(lectureId, { quiz: scorePct, ...(reachedEndRef.current ? { done: true } : {}) })
  }

  if (practice) {
    return (
      <QuizRunner
        lectureTitle={title}
        lectureId={lectureId}
        subject={subject}
        classNumber={classNumber}
        questions={questions}
        flashcards={flashcards}
        initialMode={practice}
        onFinished={onQuizFinished}
        onExit={() => setPractice(null)}
      />
    )
  }

  const partLabel =
    partCount > 0 ? `Dio ${Math.min(currentPart + 1, partCount)} od ${partCount}` : `${Math.round(progress * 100)}%`

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 1. Sticky progress strip — sits right under the 64px app bar. */}
      <div className="sticky top-16 z-40 -mx-4 px-4 bg-background border-b-2 border-border">
        <div className="h-11 flex items-center gap-2">
          <Link
            href={subjectHref}
            aria-label="Nazad"
            className="w-9 h-11 -ml-1 flex items-center justify-center text-secondary rounded-lg shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2.6} />
          </Link>
          <Badge variant="secondary" className="shrink-0 max-w-[110px] truncate">
            {subject}
          </Badge>
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            <div
              role="progressbar"
              aria-label="Napredak čitanja"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              className="h-1.5 rounded-full bg-border overflow-hidden"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-150"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span className="text-[11px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground tabular-nums">
              {partLabel}
            </span>
          </div>
          <LectureLikeButton lectureId={lectureId} />
        </div>
      </div>

      {/* 2. Title block */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2 flex-wrap">
          {isCurrent && (
            <Badge>
              <Zap strokeWidth={2.6} /> Trenutna lekcija
            </Badge>
          )}
          {done && (
            <Badge>
              <Check strokeWidth={2.6} /> Završeno
            </Badge>
          )}
        </div>
        <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading">{title}</h1>
        <p className="text-[13px] font-bold text-muted-foreground flex items-center gap-1.5 flex-wrap">
          <span>{subject}</span>
          <span aria-hidden>·</span>
          <span>{classNumber}. razred</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" strokeWidth={2.6} /> ~{readingMinutes} min čitanja
          </span>
        </p>
        {(lectureIndex !== null || dateLabel) && (
          <p className="text-[13px] font-bold text-muted-foreground">
            {lectureIndex !== null && `Lekcija ${lectureIndex + 1} od ${lectureCount}`}
            {lectureIndex !== null && dateLabel && ' · '}
            {dateLabel}
          </p>
        )}
        {resumePart !== null && activeSection === 'content' && (
          <button
            type="button"
            onClick={() => scrollToPart(resumePart)}
            className="inline-flex items-center gap-1.5 h-11 px-3.5 rounded-xl border-2 border-secondary-light-border bg-secondary-light text-secondary text-[12px] font-extrabold uppercase tracking-[0.04em] shadow-[0_2px_0_var(--color-secondary-light-border)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none"
          >
            <Play className="w-4 h-4" strokeWidth={2.6} /> Nastavi od dijela {resumePart + 1}
          </button>
        )}
      </div>

      <Tabs id={`lecture-tabs-${lectureId}`} value={activeSection} onValueChange={(value) => setActiveSection(value as Section)}>
        <TabsList>
          <TabsTrigger value="content">📖 Lekcija</TabsTrigger>
          {hasVideo && <TabsTrigger value="video">🎬 Video</TabsTrigger>}
          <TabsTrigger value="quiz">🧠 Kviz</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Kept mounted so the server-rendered body is never thrown away. */}
      <div className="space-y-4" hidden={activeSection !== 'content'}>
        {/* 3. Outline — derived from the section headings, never invented. */}
        {showOutline && (
          <Card className="gap-3 overflow-visible">
            <div className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary-text" strokeWidth={2.6} />
              <h2 className="text-[17px] font-extrabold leading-[1.3] text-heading">Šta ćeš naučiti</h2>
            </div>
            <ul className="space-y-1">
              {outline.slice(0, 5).map((heading, i) => {
                const checked = passed[i]
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => scrollToPart(i)}
                      className="w-full min-h-11 py-1.5 flex items-center gap-3 text-left rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <span
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-200 ${
                          checked ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-background'
                        }`}
                      >
                        {checked && <Check className="w-4 h-4" strokeWidth={3} />}
                      </span>
                      <span
                        className={`text-[15px] font-bold leading-[1.4] ${checked ? 'text-muted-foreground' : 'text-foreground'}`}
                      >
                        {heading}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}

        {/* 4–7. Section cards, callouts, key terms, summary — server markup. */}
        <div ref={bodyRef}>{content}</div>

        {/* 8. Practice CTA */}
        {hasPractice && (
          <div className="pt-2 space-y-3">
            {hasQuiz && (
              <Button className="w-full" onClick={() => setPractice('quiz')}>
                <Brain strokeWidth={2.4} /> Provjeri znanje
              </Button>
            )}
            {hasFlashcards && (
              <Button variant="outline" className="w-full" onClick={() => setPractice('flashcards')}>
                <Layers strokeWidth={2.4} /> Kartice za učenje
              </Button>
            )}
          </div>
        )}

        {/* 9. Prev / next */}
        {(prev || next) && (
          <div className="pt-2 space-y-2.5">
            {next && (
              <NeighbourRow href={`${subjectHref}/${next.id}`} label="Sljedeća lekcija" title={next.title} direction="next" />
            )}
            {prev && (
              <NeighbourRow href={`${subjectHref}/${prev.id}`} label="Prethodna lekcija" title={prev.title} direction="prev" />
            )}
          </div>
        )}
      </div>

      {activeSection === 'video' && hasVideo && (
        <div className="animate-fade-in space-y-3">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-border bg-muted">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
              title={title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <a
            href={videoUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-11 text-[13px] font-extrabold uppercase tracking-[0.04em] text-secondary hover:underline underline-offset-4"
          >
            <Play className="w-4 h-4" strokeWidth={2.6} /> Otvori na YouTube
          </a>
        </div>
      )}

      {activeSection === 'quiz' && (
        <div className="animate-fade-in space-y-4">
          <Card>
            <CardContent className="p-1 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-secondary-light flex items-center justify-center mx-auto">
                <Brain className="w-8 h-8 text-secondary" strokeWidth={2.4} />
              </div>
              {hasPractice ? (
                <>
                  <h3 className="text-[20px] font-extrabold leading-[1.25] text-heading">Provjeri znanje</h3>
                  <p className="text-[13px] font-bold text-muted-foreground">
                    {[hasQuiz && plural(questions.length, 'pitanje', 'pitanja', 'pitanja'), hasFlashcards && plural(flashcards.length, 'kartica', 'kartice', 'kartica')]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <div className="space-y-3 pt-1">
                    {hasQuiz && (
                      <Button onClick={() => setPractice('quiz')} className="w-full">
                        <Brain strokeWidth={2.4} /> Provjeri znanje
                      </Button>
                    )}
                    {hasFlashcards && (
                      <Button variant="outline" onClick={() => setPractice('flashcards')} className="w-full">
                        <Layers strokeWidth={2.4} /> Kartice za učenje
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-[20px] font-extrabold leading-[1.25] text-heading">Kviz uskoro</h3>
                  <p className="text-[13px] font-bold text-muted-foreground">Kviz za ovu lekciju još nije dodat</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
