'use client'

import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, ChevronLeft, RotateCcw, CheckCircle2, XCircle } from 'lucide-react'
import type { FlashCard, QuizQuestion } from '../../lecture-utils'

const QUESTION_SECONDS = 15

function QuizTimer({ seconds, total }: { seconds: number; total: number }) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const progress = (seconds / total) * circumference
  const color = seconds <= 5 ? '#FF4B4B' : seconds <= 10 ? '#FFC800' : '#58CC02'

  return (
    <div className="relative w-11 h-11">
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

interface QuizRunnerProps {
  lectureTitle: string
  questions: QuizQuestion[]
  flashcards: FlashCard[]
  onExit: () => void
}

export function QuizRunner({ lectureTitle, questions, flashcards, onExit }: QuizRunnerProps) {
  const hasQuiz = questions.length > 0
  const hasFlashcards = flashcards.length > 0
  const showModeSwitcher = hasQuiz && hasFlashcards

  const [mode, setMode] = useState<'quiz' | 'flashcards'>(hasQuiz ? 'quiz' : 'flashcards')
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [timer, setTimer] = useState(QUESTION_SECONDS)

  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // The countdown runs only while a question is on screen and unanswered; every
  // state that ends it is a dependency, so the cleanup stops the interval.
  useEffect(() => {
    if (mode !== 'quiz' || !hasQuiz || answered || finished) return
    const id = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setAnswered(true)
          setSelected(-1) // timed out — counts as wrong
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
    setScore(0)
    setFinished(false)
    setTimer(QUESTION_SECONDS)
  }

  function handleAnswer(optionIdx: number) {
    if (answered) return
    setSelected(optionIdx)
    setAnswered(true)
    if (optionIdx === questions[current].correct) setScore((s) => s + 1)
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      setFinished(true)
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

  const backButton = (
    <button
      onClick={exit}
      className="inline-flex items-center gap-1 h-11 text-[13px] font-extrabold uppercase tracking-[0.04em] text-secondary w-fit hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-lg"
    >
      <ChevronLeft className="w-5 h-5" strokeWidth={2.6} /> Nazad na lekciju
    </button>
  )

  const modeSwitcher = showModeSwitcher ? (
    <Tabs
      value={mode}
      onValueChange={(value) => {
        if (value === 'quiz') {
          setMode('quiz')
          resetQuiz()
        } else {
          setMode('flashcards')
          setCurrentCard(0)
          setFlipped(false)
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
    const card = flashcards[currentCard]
    return (
      <div className="space-y-6 animate-fade-in">
        {backButton}
        <div className="text-center space-y-1">
          <h1 className="text-[20px] font-extrabold leading-[1.25] text-heading">Kartice za učenje</h1>
          <p className="text-[13px] font-bold text-muted-foreground">{lectureTitle}</p>
          <p className="text-[13px] font-bold text-muted-foreground tabular-nums">
            {currentCard + 1} / {flashcards.length}
          </p>
        </div>

        {modeSwitcher}

        {card && (
          <div
            className="relative min-h-[240px] cursor-pointer [perspective:800px]"
            onClick={() => setFlipped(!flipped)}
          >
            <div
              className="w-full min-h-[240px] transition-transform duration-500 [transform-style:preserve-3d]"
              style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              <div className="absolute inset-0 [backface-visibility:hidden]">
                <Card className="min-h-[240px] items-center justify-center h-full">
                  <CardContent className="p-2 text-center space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-full bg-secondary-light flex items-center justify-center">
                      <Brain className="w-6 h-6 text-secondary" strokeWidth={2.4} />
                    </div>
                    <p className="text-[17px] font-extrabold leading-[1.3] text-heading">{card.question}</p>
                    <p className="text-[13px] font-bold text-muted-foreground">Tapni za odgovor</p>
                  </CardContent>
                </Card>
              </div>
              <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <Card className="min-h-[240px] items-center justify-center h-full border-primary-light-border bg-primary-light shadow-[0_2px_0_var(--color-primary-light-border)]">
                  <CardContent className="p-2 text-center space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-lg font-black">✓</span>
                    </div>
                    <p className="text-[17px] font-extrabold leading-[1.3] text-primary-text">{card.answer}</p>
                    <p className="text-[13px] font-bold text-muted-foreground">Tapni za sljedeće</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              setFlipped(false)
              setCurrentCard(Math.max(0, currentCard - 1))
            }}
            disabled={currentCard === 0 && !flipped}
          >
            ← Prethodno
          </Button>
          <Button
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              if (!flipped) {
                setFlipped(true)
              } else if (currentCard < flashcards.length - 1) {
                setFlipped(false)
                setCurrentCard(currentCard + 1)
              } else {
                setFlipped(false)
                setCurrentCard(0)
              }
            }}
          >
            {!flipped ? (
              'Otkrij'
            ) : currentCard === flashcards.length - 1 ? (
              <span className="flex items-center gap-1">
                <RotateCcw className="w-4 h-4" strokeWidth={2.6} /> Ponovo
              </span>
            ) : (
              'Sljedeće →'
            )}
          </Button>
        </div>

        <div className="flex justify-center gap-1.5">
          {flashcards.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentCard
                  ? 'bg-primary scale-125'
                  : i < currentCard
                    ? 'bg-primary-light-border'
                    : 'bg-border'
              }`}
            />
          ))}
        </div>
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
          Nazad
        </Button>
      </div>
    )
  }

  // ===== RESULT =====
  if (finished) {
    const percentage = Math.round((score / questions.length) * 100)
    const emoji = percentage >= 80 ? '🏆' : percentage >= 60 ? '👍' : percentage >= 40 ? '📚' : '💪'
    return (
      <div className="space-y-6 animate-fade-in">
        {backButton}
        <Card className="items-center text-center gap-4 py-8">
          <div className="text-6xl">{emoji}</div>
          <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading">Kviz završen!</h1>
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="10" className="text-border" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#58CC02"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${percentage * 3.27} 327`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[36px] leading-none font-black tabular-nums text-heading">{percentage}%</span>
              <span className="text-[13px] font-bold text-muted-foreground mt-1">
                {score} od {questions.length}
              </span>
            </div>
          </div>
          <p className="text-[15px] font-bold text-muted-foreground">
            {percentage >= 80
              ? 'Odlično! Savladao/la si ovu lekciju!'
              : percentage >= 60
                ? 'Dobro! Još malo vježbe i biće savršeno.'
                : 'Probaj ponovo nakon što ponoviš lekciju.'}
          </p>
          <div className="flex flex-col gap-3 w-full pt-2">
            <Button variant="outline" className="w-full" onClick={resetQuiz}>
              <RotateCcw strokeWidth={2.6} /> Ponovo
            </Button>
            {hasFlashcards && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setMode('flashcards')
                  setCurrentCard(0)
                  setFlipped(false)
                }}
              >
                <Brain strokeWidth={2.4} /> Kartice
              </Button>
            )}
            <Button className="w-full" onClick={exit}>
              Nazad
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ===== QUESTION =====
  const q = questions[current]
  return (
    <div className={`space-y-5 animate-fade-in ${answered ? 'pb-24' : ''}`}>
      {backButton}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[20px] font-extrabold leading-[1.25] text-heading">Provjeri znanje</h1>
          <div className="flex items-center gap-2">
            <QuizTimer seconds={timer} total={QUESTION_SECONDS} />
            <Badge variant="outline" className="tabular-nums">
              {current + 1} / {questions.length}
            </Badge>
          </div>
        </div>

        {modeSwitcher}

        <div className="w-full h-4 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary shadow-[inset_0_4px_0_rgba(255,255,255,0.3)] transition-all duration-500"
            style={{ width: `${((current + (answered ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-full bg-secondary-light text-secondary text-[13px] font-extrabold flex items-center justify-center shrink-0 tabular-nums">
              {current + 1}
            </span>
            <p className="text-[17px] font-extrabold leading-[1.3] text-heading pt-1">{q.question}</p>
          </div>

          <div className="space-y-2.5">
            {q.options.map((option, idx) => {
              let cardClass =
                'border-border bg-background text-foreground shadow-[0_4px_0_var(--color-border)] hover:bg-muted active:translate-y-[4px] active:shadow-none cursor-pointer'
              if (answered) {
                if (idx === q.correct) {
                  cardClass =
                    'border-primary-light-border bg-primary-light text-primary-text shadow-[0_4px_0_var(--color-primary-light-border)]'
                } else if (idx === selected && idx !== q.correct) {
                  cardClass = 'border-[#FFB3B5] bg-[#FFDFE0] text-[#EA2B2B] shadow-[0_4px_0_#FFB3B5]'
                } else {
                  cardClass = 'border-border bg-background text-disabled shadow-none'
                }
              } else if (idx === selected) {
                cardClass =
                  'border-secondary-light-border bg-secondary-light text-secondary shadow-[0_4px_0_var(--color-secondary-light-border)]'
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={answered}
                  className={`w-full min-h-[50px] text-left px-4 py-3 rounded-2xl border-2 text-[15px] font-bold transition-[transform,box-shadow,background-color,border-color,color] duration-[80ms] flex items-center gap-3 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${cardClass}`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-extrabold shrink-0 ${
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
                      <CheckCircle2 className="w-4 h-4" strokeWidth={2.6} />
                    ) : answered && idx === selected && idx !== q.correct ? (
                      <XCircle className="w-4 h-4" strokeWidth={2.6} />
                    ) : (
                      String.fromCharCode(65 + idx)
                    )}
                  </span>
                  <span>{option}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-1.5">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === current
                ? 'bg-primary scale-125'
                : i < current
                  ? 'bg-primary-light-border'
                  : 'bg-border'
            }`}
          />
        ))}
      </div>

      {answered && (
        <div className="fixed left-0 right-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-40 bg-background border-t-2 border-border px-4 py-3 animate-fade-in">
          <div className="max-w-md mx-auto">
            <Button className="w-full" onClick={handleNext}>
              {current + 1 >= questions.length ? 'Pogledaj rezultat' : 'Sljedeće pitanje →'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
