'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Brain, ChevronLeft, RotateCcw, CheckCircle2, XCircle } from 'lucide-react'
import type { FlashCard, QuizQuestion } from '../../lecture-utils'

const QUESTION_SECONDS = 15

function QuizTimer({ seconds, total }: { seconds: number; total: number }) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const progress = (seconds / total) * circumference
  const color = seconds <= 5 ? '#F44336' : seconds <= 10 ? '#FFC107' : '#7c5cfc'

  return (
    <div className="relative w-11 h-11">
      <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 linear"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${seconds <= 5 ? 'text-red-400' : 'text-foreground'}`}>
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
      className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all"
    >
      <ChevronLeft className="w-4 h-4" /> Nazad na lekciju
    </button>
  )

  // ===== FLASHCARDS MODE =====
  if (mode === 'flashcards' && hasFlashcards) {
    const card = flashcards[currentCard]
    return (
      <div className="space-y-6 animate-fade-in">
        {backButton}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold gradient-text">Kartice za učenje</h1>
          <p className="text-xs text-muted-foreground">{lectureTitle}</p>
          <p className="text-xs text-muted-foreground">
            {currentCard + 1} / {flashcards.length}
          </p>
        </div>

        {showModeSwitcher && (
          <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
            <button
              onClick={() => {
                setMode('quiz')
                resetQuiz()
              }}
              className="flex-1 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
            >
              Kviz
            </button>
            <button className="flex-1 py-2 rounded-lg text-xs font-medium bg-background text-foreground shadow-sm">
              Kartice
            </button>
          </div>
        )}

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
                <Card className="border-border/30 bg-card/50 backdrop-blur min-h-[240px] flex items-center justify-center h-full">
                  <CardContent className="p-6 text-center space-y-4">
                    <Brain className="w-8 h-8 mx-auto text-primary opacity-60" />
                    <p className="text-lg font-medium leading-relaxed">{card.question}</p>
                    <p className="text-xs text-muted-foreground">Tapni za odgovor</p>
                  </CardContent>
                </Card>
              </div>
              <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <Card className="border-border/30 bg-card/50 backdrop-blur min-h-[240px] flex items-center justify-center h-full">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-8 h-8 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-400 text-lg">✓</span>
                    </div>
                    <p className="text-lg font-medium text-green-400 leading-relaxed">{card.answer}</p>
                    <p className="text-xs text-muted-foreground">Tapni za sljedeće</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setFlipped(false)
              setCurrentCard(Math.max(0, currentCard - 1))
            }}
            disabled={currentCard === 0 && !flipped}
            className="px-4 py-2.5 rounded-xl bg-muted text-sm disabled:opacity-30 transition-all active:scale-95"
          >
            ← Prethodno
          </button>
          <button
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
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm transition-all active:scale-95"
          >
            {!flipped ? (
              'Otkrij'
            ) : currentCard === flashcards.length - 1 ? (
              <span className="flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Ponovo
              </span>
            ) : (
              'Sljedeće →'
            )}
          </button>
        </div>

        <div className="flex justify-center gap-1.5">
          {flashcards.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentCard ? 'bg-primary scale-125' : i < currentCard ? 'bg-primary/40' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!hasQuiz) {
    return (
      <div className="space-y-6 animate-fade-in text-center py-12">
        <Brain className="w-12 h-12 mx-auto text-muted-foreground/30" />
        <p className="text-muted-foreground">Kviz za ovu lekciju još nije dodat</p>
        <button
          onClick={exit}
          className="px-5 py-2.5 rounded-xl bg-muted text-sm font-medium transition-all active:scale-95"
        >
          Nazad
        </button>
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
        <div className="text-center space-y-4 py-8">
          <div className="text-6xl">{emoji}</div>
          <h1 className="text-2xl font-bold gradient-text">Kviz završen!</h1>
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${percentage * 3.27} 327`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{percentage}%</span>
              <span className="text-xs text-muted-foreground">
                {score} od {questions.length}
              </span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            {percentage >= 80
              ? 'Odlično! Savladao/la si ovu lekciju!'
              : percentage >= 60
                ? 'Dobro! Još malo vježbe i biće savršeno.'
                : 'Probaj ponovo nakon što ponoviš lekciju.'}
          </p>
          <div className="flex gap-3 justify-center pt-4">
            <button
              onClick={resetQuiz}
              className="px-5 py-2.5 rounded-xl bg-muted text-sm font-medium flex items-center gap-2 transition-all active:scale-95 hover:bg-muted/80"
            >
              <RotateCcw className="w-4 h-4" /> Ponovo
            </button>
            {hasFlashcards && (
              <button
                onClick={() => {
                  setMode('flashcards')
                  setCurrentCard(0)
                  setFlipped(false)
                }}
                className="px-5 py-2.5 rounded-xl bg-muted text-sm font-medium flex items-center gap-2 transition-all active:scale-95 hover:bg-muted/80"
              >
                <Brain className="w-4 h-4" /> Kartice
              </button>
            )}
            <button
              onClick={exit}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all active:scale-95"
            >
              Nazad
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ===== QUESTION =====
  const q = questions[current]
  return (
    <div className="space-y-5 animate-fade-in">
      {backButton}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold gradient-text">Provjeri znanje</h1>
          <div className="flex items-center gap-2">
            <QuizTimer seconds={timer} total={QUESTION_SECONDS} />
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {current + 1} / {questions.length}
            </span>
          </div>
        </div>

        {showModeSwitcher && (
          <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
            <button className="flex-1 py-2 rounded-lg text-xs font-medium bg-background text-foreground shadow-sm">
              Kviz
            </button>
            <button
              onClick={() => {
                setMode('flashcards')
                setCurrentCard(0)
                setFlipped(false)
              }}
              className="flex-1 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
            >
              Kartice
            </button>
          </div>
        )}

        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7c5cfc] to-[#5b3fd9] transition-all duration-500"
            style={{ width: `${((current + (answered ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <Card className="border-border/30 bg-card/50 backdrop-blur">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-full bg-[#7c5cfc]/20 text-[#7c5cfc] text-sm font-bold flex items-center justify-center flex-shrink-0">
              {current + 1}
            </span>
            <p className="text-base font-medium leading-relaxed pt-1">{q.question}</p>
          </div>

          <div className="space-y-2.5">
            {q.options.map((option, idx) => {
              let cardClass =
                'border border-border/40 bg-background/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
              if (answered) {
                if (idx === q.correct) {
                  cardClass = 'border-2 border-green-500/60 bg-green-500/10'
                } else if (idx === selected && idx !== q.correct) {
                  cardClass = 'border-2 border-red-500/60 bg-red-500/10'
                } else {
                  cardClass = 'border border-border/20 bg-background/30 opacity-50'
                }
              } else if (idx === selected) {
                cardClass = 'border-2 border-primary bg-primary/10'
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={answered}
                  className={`w-full text-left p-3.5 rounded-xl transition-all duration-300 flex items-center gap-3 ${cardClass}`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      answered && idx === q.correct
                        ? 'bg-green-500 text-white'
                        : answered && idx === selected
                          ? 'bg-red-500 text-white'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {answered && idx === q.correct ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : answered && idx === selected && idx !== q.correct ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      String.fromCharCode(65 + idx)
                    )}
                  </span>
                  <span className="text-sm">{option}</span>
                </button>
              )
            })}
          </div>

          {answered && (
            <div className="pt-2 animate-fade-in">
              <button
                onClick={handleNext}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7c5cfc] to-[#5b3fd9] text-white font-medium text-sm transition-all active:scale-[0.98]"
              >
                {current + 1 >= questions.length ? 'Pogledaj rezultat' : 'Sljedeće pitanje →'}
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center gap-1.5">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === current
                ? 'bg-primary scale-125 ring-2 ring-primary/30'
                : i < current
                  ? 'bg-primary/50'
                  : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
