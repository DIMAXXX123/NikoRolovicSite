'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, Check, CheckCircle2, ChevronLeft, Layers, RotateCcw, X, XCircle } from 'lucide-react'
import type { FlashCard, QuizQuestion } from '../../lecture-utils'

const QUESTION_SECONDS = 15
const SWIPE_THRESHOLD = 80

type Mode = 'quiz' | 'flashcards'
type Mastery = { label: string; className: string }

function masteryFor(percentage: number): Mastery {
  if (percentage >= 80)
    return {
      label: 'Savladano',
      className: 'border-primary-light-border bg-primary-light text-primary-text',
    }
  if (percentage >= 60)
    return {
      label: 'Poznato',
      className: 'border-secondary-light-border bg-secondary-light text-secondary',
    }
  return {
    label: 'Još učiš',
    className: 'border-[#FFE28A] bg-[#FFF4C4] text-[#C79000]',
  }
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

function QuizTimer({ seconds, total }: { seconds: number; total: number }) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const progress = (seconds / total) * circumference
  const color = seconds <= 5 ? '#FF4B4B' : seconds <= 10 ? '#FFC800' : '#58CC02'

  return (
    <div className="relative w-11 h-11 shrink-0">
      <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 linear"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-[13px] font-black tabular-nums ${seconds <= 5 ? 'text-destructive' : 'text-heading'}`}>
          {seconds}
        </span>
      </div>
    </div>
  )
}

/** Sticky strip: back link + one progress segment per item (§4.9 as a segmented tail). */
function PracticeStrip({
  onBack,
  segments,
}: {
  onBack: () => void
  segments: ('correct' | 'wrong' | 'current' | 'todo')[]
}) {
  return (
    <div className="sticky top-16 z-40 -mx-4 px-4 bg-background border-b-2 border-border">
      <div className="h-11 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 h-11 -ml-1 pr-2 text-[13px] font-extrabold uppercase tracking-[0.04em] text-secondary rounded-lg shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.6} />
          <span className="hidden min-[400px]:inline">Nazad na lekciju</span>
          <span className="min-[400px]:hidden">Nazad</span>
        </button>
        <div className="flex-1 flex gap-1" aria-hidden>
          {segments.map((s, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                s === 'correct'
                  ? 'bg-primary'
                  : s === 'wrong'
                    ? 'bg-destructive'
                    : s === 'current'
                      ? 'bg-secondary'
                      : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ScoreRing({ percentage, correct, total }: { percentage: number; correct: number; total: number }) {
  const circumference = 2 * Math.PI * 52
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="10" className="text-border" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[36px] leading-none font-black tabular-nums text-heading">{percentage}%</span>
        <span className="text-[13px] font-bold text-muted-foreground mt-1">
          {correct} od {total}
        </span>
      </div>
    </div>
  )
}

function Dots({ count, current, results }: { count: number; current: number; results: (boolean | null)[] }) {
  return (
    <div className="flex justify-center gap-1.5 flex-wrap" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
            i === current
              ? 'bg-secondary scale-125'
              : results[i] === true
                ? 'bg-primary'
                : results[i] === false
                  ? 'bg-destructive'
                  : 'bg-border'
          }`}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

interface QuizRunnerProps {
  lectureTitle: string
  questions: QuizQuestion[]
  flashcards: FlashCard[]
  onExit: () => void
  initialMode?: Mode
  /** Called once per finished quiz round with the score in percent. */
  onFinished?: (scorePercent: number) => void
}

export function QuizRunner({ lectureTitle, questions, flashcards, onExit, initialMode, onFinished }: QuizRunnerProps) {
  const hasQuiz = questions.length > 0
  const hasFlashcards = flashcards.length > 0
  const showModeSwitcher = hasQuiz && hasFlashcards

  const [mode, setMode] = useState<Mode>(() => {
    if (initialMode === 'flashcards' && hasFlashcards) return 'flashcards'
    if (initialMode === 'quiz' && hasQuiz) return 'quiz'
    return hasQuiz ? 'quiz' : 'flashcards'
  })

  // ----- quiz state
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [results, setResults] = useState<(boolean | null)[]>(() => questions.map(() => null))
  const [finished, setFinished] = useState(false)
  const [timer, setTimer] = useState(QUESTION_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ----- flashcard state
  const [deck, setDeck] = useState<number[]>(() => flashcards.map((_, i) => i))
  const [cardPos, setCardPos] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<number>>(() => new Set())
  const [unknown, setUnknown] = useState<Set<number>>(() => new Set())
  const [drag, setDrag] = useState<{ startX: number; dx: number } | null>(null)
  const [leaving, setLeaving] = useState<'left' | 'right' | null>(null)

  const score = results.filter((r) => r === true).length

  // The countdown runs only while a question is on screen and unanswered.
  useEffect(() => {
    if (mode !== 'quiz' || !hasQuiz || answered || finished) return
    const id = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setAnswered(true)
          setSelected(-1) // timed out — counts as wrong
          setResults((r) => r.map((v, i) => (i === current ? false : v)))
          return 0
        }
        return prev - 1
      })
    }, 1000)
    timerRef.current = id
    return () => clearInterval(id)
  }, [mode, current, hasQuiz, answered, finished])

  function resetQuiz() {
    setCurrent(0)
    setSelected(null)
    setAnswered(false)
    setResults(questions.map(() => null))
    setFinished(false)
    setTimer(QUESTION_SECONDS)
  }

  function handleAnswer(optionIdx: number) {
    if (answered) return
    const correct = optionIdx === questions[current].correct
    setSelected(optionIdx)
    setAnswered(true)
    setResults((r) => r.map((v, i) => (i === current ? correct : v)))
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      setFinished(true)
      onFinished?.(Math.round((score / questions.length) * 100))
    } else {
      setCurrent((c) => c + 1)
      setSelected(null)
      setAnswered(false)
      setTimer(QUESTION_SECONDS)
    }
  }

  function exit() {
    if (timerRef.current) clearInterval(timerRef.current)
    onExit()
  }

  function restartCards(subset?: number[]) {
    setDeck(subset ?? flashcards.map((_, i) => i))
    setCardPos(0)
    setFlipped(false)
    setKnown(new Set())
    setUnknown(new Set())
    setDrag(null)
    setLeaving(null)
  }

  function judgeCard(knows: boolean) {
    if (leaving) return
    const idx = deck[cardPos]
    if (idx === undefined) return
    setLeaving(knows ? 'right' : 'left')
    setDrag(null)
    window.setTimeout(() => {
      ;(knows ? setKnown : setUnknown)((prev) => new Set(prev).add(idx))
      setFlipped(false)
      setCardPos((p) => p + 1)
      setLeaving(null)
    }, 220)
  }

  // Swipe: pointer-tracked horizontal drag; a short tap flips the card.
  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (leaving) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ startX: e.clientX, dx: 0 })
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag) return
    setDrag({ startX: drag.startX, dx: e.clientX - drag.startX })
  }
  function onPointerUp() {
    if (!drag) return
    const { dx } = drag
    if (dx > SWIPE_THRESHOLD) judgeCard(true)
    else if (dx < -SWIPE_THRESHOLD) judgeCard(false)
    else {
      if (Math.abs(dx) < 8) setFlipped((f) => !f)
      setDrag(null)
    }
  }

  const modeSwitcher = showModeSwitcher ? (
    <Tabs
      id="quiz-mode"
      value={mode}
      onValueChange={(value) => {
        if (value === 'quiz') {
          setMode('quiz')
          resetQuiz()
        } else {
          setMode('flashcards')
          restartCards()
        }
      }}
    >
      <TabsList>
        <TabsTrigger value="quiz">Kviz</TabsTrigger>
        <TabsTrigger value="flashcards">Kartice</TabsTrigger>
      </TabsList>
    </Tabs>
  ) : null

  // ===== FLASHCARDS MODE =====
  if (mode === 'flashcards' && hasFlashcards) {
    const cardIdx = deck[cardPos]
    const card = cardIdx !== undefined ? flashcards[cardIdx] : null
    const segments = deck.map((idx, i) =>
      known.has(idx) ? 'correct' : unknown.has(idx) ? 'wrong' : i === cardPos ? 'current' : 'todo',
    ) as ('correct' | 'wrong' | 'current' | 'todo')[]
    const dx = leaving === 'right' ? 480 : leaving === 'left' ? -480 : (drag?.dx ?? 0)
    const tilt = Math.max(-12, Math.min(12, dx / 12))
    const missed = [...unknown]

    return (
      <div className="space-y-5 animate-fade-in">
        <PracticeStrip onBack={exit} segments={segments} />

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[20px] font-extrabold leading-[1.25] text-heading">Kartice za učenje</h1>
            {card && (
              <span className="text-[13px] font-extrabold text-muted-foreground tabular-nums shrink-0">
                {cardPos + 1} / {deck.length}
              </span>
            )}
          </div>
          <p className="text-[13px] font-bold text-muted-foreground">{lectureTitle}</p>
        </div>

        {modeSwitcher}

        {card ? (
          <>
            {/* Clipped on the x-axis so the fly-out never widens the page. */}
            <div className="overflow-x-clip -mx-4 px-4">
              <div
                className="relative min-h-[240px] select-none touch-pan-y [perspective:900px]"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => setDrag(null)}
                style={{
                  transform: `translateX(${dx}px) rotate(${tilt}deg)`,
                  opacity: leaving ? 0 : 1,
                  transition: drag ? 'none' : 'transform 220ms cubic-bezier(0.4,0,0.2,1), opacity 220ms',
                  cursor: 'grab',
                }}
              >
                <div
                  className="w-full min-h-[240px] transition-transform duration-300 [transform-style:preserve-3d]"
                  style={{
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  <div className="absolute inset-0 [backface-visibility:hidden]">
                    <Card className="min-h-[240px] h-full items-center justify-center">
                      <CardContent className="p-2 text-center space-y-4">
                        <div className="w-12 h-12 mx-auto rounded-full bg-secondary-light flex items-center justify-center">
                          <Layers className="w-6 h-6 text-secondary" strokeWidth={2.4} />
                        </div>
                        <p className="text-[20px] font-extrabold leading-[1.25] text-heading">{card.question}</p>
                        <p className="text-[13px] font-bold text-muted-foreground">Tapni za odgovor</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <Card className="min-h-[240px] h-full items-center justify-center border-primary-light-border bg-primary-light shadow-[0_2px_0_var(--color-primary-light-border)]">
                      <CardContent className="p-2 text-center space-y-4">
                        <div className="w-12 h-12 mx-auto rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-6 h-6 text-primary-foreground" strokeWidth={3} />
                        </div>
                        <p className="text-[17px] font-extrabold leading-[1.4] text-primary-text">{card.answer}</p>
                        <p className="text-[13px] font-bold text-muted-foreground">Znaš li ovo?</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                {/* Swipe hints */}
                <span
                  className="absolute top-3 left-3 rounded-lg border-2 border-[#FFB3B5] bg-[#FFDFE0] px-2 py-1 text-[12px] font-extrabold uppercase tracking-[0.04em] text-[#EA2B2B] transition-opacity"
                  style={{
                    opacity: dx < -20 ? Math.min(1, -dx / SWIPE_THRESHOLD) : 0,
                  }}
                >
                  Ne znam
                </span>
                <span
                  className="absolute top-3 right-3 rounded-lg border-2 border-primary-light-border bg-primary-light px-2 py-1 text-[12px] font-extrabold uppercase tracking-[0.04em] text-primary-text transition-opacity"
                  style={{
                    opacity: dx > 20 ? Math.min(1, dx / SWIPE_THRESHOLD) : 0,
                  }}
                >
                  Znam
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 text-[#EA2B2B]" onClick={() => judgeCard(false)}>
                <X strokeWidth={2.8} /> Ne znam
              </Button>
              <Button className="flex-1" onClick={() => judgeCard(true)}>
                <Check strokeWidth={2.8} /> Znam
              </Button>
            </div>
            <p className="text-center text-[13px] font-bold text-muted-foreground">
              Prevuci desno = znam, lijevo = ne znam
            </p>
          </>
        ) : (
          <Card className="items-center text-center gap-4 py-8">
            <div className="text-6xl">{missed.length === 0 ? '🏆' : '📚'}</div>
            <h2 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading">
              Kartice završene!
            </h2>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border-2 border-primary-light-border bg-primary-light text-primary-text text-[13px] font-extrabold tabular-nums">
                <Check className="w-4 h-4" strokeWidth={3} /> Znaš {known.size}
              </span>
              <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border-2 border-[#FFB3B5] bg-[#FFDFE0] text-[#EA2B2B] text-[13px] font-extrabold tabular-nums">
                <X className="w-4 h-4" strokeWidth={3} /> Ne znaš {unknown.size}
              </span>
            </div>
            <div className="flex flex-col gap-3 w-full pt-2">
              {missed.length > 0 && (
                <Button className="w-full" onClick={() => restartCards(missed)}>
                  <RotateCcw strokeWidth={2.6} /> Ponovi{' '}
                  {missed.length === 1 ? '1 karticu' : `${missed.length} kartice`}
                </Button>
              )}
              <Button
                variant={missed.length > 0 ? 'outline' : 'default'}
                className="w-full"
                onClick={() => restartCards()}
              >
                <RotateCcw strokeWidth={2.6} /> Ponovo
              </Button>
              {hasQuiz && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMode('quiz')
                    resetQuiz()
                  }}
                >
                  <Brain strokeWidth={2.4} /> Provjeri znanje
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={exit}>
                Nazad na lekciju
              </Button>
            </div>
          </Card>
        )}
      </div>
    )
  }

  if (!hasQuiz) {
    return (
      <div className="space-y-4 animate-fade-in text-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Brain className="w-8 h-8 text-disabled" strokeWidth={2.4} />
        </div>
        <p className="text-[17px] font-extrabold text-foreground">Kviz za ovu lekciju još nije dodat</p>
        <Button variant="outline" onClick={exit}>
          Nazad na lekciju
        </Button>
      </div>
    )
  }

  const quizSegments = questions.map((_, i) =>
    results[i] === true ? 'correct' : results[i] === false ? 'wrong' : i === current && !finished ? 'current' : 'todo',
  ) as ('correct' | 'wrong' | 'current' | 'todo')[]

  // ===== RESULT =====
  if (finished) {
    const percentage = Math.round((score / questions.length) * 100)
    const emoji = percentage >= 80 ? '🏆' : percentage >= 60 ? '👍' : percentage >= 40 ? '📚' : '💪'
    const mastery = masteryFor(percentage)
    return (
      <div className="space-y-5 animate-fade-in">
        <PracticeStrip onBack={exit} segments={quizSegments} />
        <Card className="items-center text-center gap-4 py-8">
          <div className="text-6xl">{emoji}</div>
          <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading">Kviz završen!</h1>
          <ScoreRing percentage={percentage} correct={score} total={questions.length} />
          <span
            className={`inline-flex items-center h-9 px-4 rounded-full border-2 text-[12px] font-extrabold uppercase tracking-[0.06em] ${mastery.className}`}
          >
            {mastery.label}
          </span>
          <p className="text-[15px] font-bold text-muted-foreground">
            {percentage >= 80
              ? 'Odlično! Savladao/la si ovu lekciju!'
              : percentage >= 60
                ? 'Dobro! Još malo vježbe i biće savršeno.'
                : 'Probaj ponovo nakon što ponoviš lekciju.'}
          </p>
          <div className="flex flex-col gap-3 w-full pt-2">
            <Button className="w-full" onClick={resetQuiz}>
              <RotateCcw strokeWidth={2.6} /> Ponovo
            </Button>
            {hasFlashcards && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setMode('flashcards')
                  restartCards()
                }}
              >
                <Layers strokeWidth={2.4} /> Kartice za učenje
              </Button>
            )}
            <Button variant="outline" className="w-full" onClick={exit}>
              Nazad na lekciju
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ===== QUESTION =====
  const q = questions[current]
  const wasCorrect = answered && selected === q.correct
  return (
    <div className={`space-y-5 animate-fade-in ${answered ? 'pb-40' : ''}`}>
      <PracticeStrip onBack={exit} segments={quizSegments} />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[20px] font-extrabold leading-[1.25] text-heading">Provjeri znanje</h1>
            <p className="text-[13px] font-bold text-muted-foreground tabular-nums">
              Pitanje {current + 1} od {questions.length}
            </p>
          </div>
          <QuizTimer seconds={timer} total={QUESTION_SECONDS} />
        </div>
        {modeSwitcher}
      </div>

      <Card className="gap-4 overflow-visible">
        <p className="text-[20px] font-extrabold leading-[1.3] text-heading">{q.question}</p>

        <div className="space-y-3">
          {q.options.map((option, idx) => {
            let cardClass =
              'border-border bg-background text-foreground shadow-[0_4px_0_var(--color-border)] hover:bg-muted active:translate-y-[4px] active:shadow-none cursor-pointer'
            if (answered) {
              if (idx === q.correct) {
                cardClass =
                  'border-primary-light-border bg-primary-light text-primary-text shadow-[0_4px_0_var(--color-primary-light-border)]'
              } else if (idx === selected) {
                cardClass = 'border-[#FFB3B5] bg-[#FFDFE0] text-[#EA2B2B] shadow-[0_4px_0_#FFB3B5]'
              } else {
                cardClass = 'border-border bg-background text-disabled shadow-none'
              }
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleAnswer(idx)}
                disabled={answered}
                className={`w-full min-h-14 text-left px-4 py-3 rounded-2xl border-2 text-[15px] font-extrabold transition-[transform,box-shadow,background-color,border-color,color] duration-[80ms] flex items-center gap-3 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${cardClass}`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-extrabold shrink-0 ${
                    answered && idx === q.correct
                      ? 'bg-primary text-primary-foreground'
                      : answered && idx === selected
                        ? 'bg-destructive text-destructive-foreground'
                        : answered
                          ? 'bg-muted text-disabled'
                          : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {answered && idx === q.correct ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : answered && idx === selected ? (
                    <X className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    String.fromCharCode(65 + idx)
                  )}
                </span>
                <span className="leading-[1.4]">{option}</span>
              </button>
            )
          })}
        </div>
      </Card>

      <Dots count={questions.length} current={current} results={results} />

      {answered && (
        <div
          className={`fixed left-0 right-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-40 border-t-2 px-4 pt-4 pb-4 animate-slide-up ${
            wasCorrect ? 'bg-[#D7FFB8] border-[#B5EE8A]' : 'bg-[#FFDFE0] border-[#FFB3B5]'
          }`}
          role="status"
        >
          <div className="max-w-md mx-auto space-y-3">
            <div className="flex items-start gap-3">
              {wasCorrect ? (
                <CheckCircle2 className="w-7 h-7 text-[#58A700] shrink-0" strokeWidth={2.6} />
              ) : (
                <XCircle className="w-7 h-7 text-[#EA2B2B] shrink-0" strokeWidth={2.6} />
              )}
              <div className="min-w-0">
                <p
                  className={`text-[20px] font-extrabold leading-[1.25] ${wasCorrect ? 'text-[#58A700]' : 'text-[#EA2B2B]'}`}
                >
                  {wasCorrect ? 'Tačno!' : 'Netačno'}
                </p>
                {!wasCorrect && (
                  <p className="text-[15px] font-bold text-[#EA2B2B] leading-[1.4]">
                    {selected === -1 ? 'Vrijeme je isteklo. ' : ''}Tačan odgovor: {q.options[q.correct]}
                  </p>
                )}
              </div>
            </div>
            <Button className="w-full" variant={wasCorrect ? 'default' : 'destructive'} onClick={handleNext}>
              {current + 1 >= questions.length ? 'Pogledaj rezultat' : 'Nastavi'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
