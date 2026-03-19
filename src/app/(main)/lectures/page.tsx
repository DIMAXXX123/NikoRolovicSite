'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ChevronRight, ChevronLeft, Plus, X, Play, Brain, RotateCcw, ThumbsUp, Trophy, CheckCircle2, XCircle, Zap } from 'lucide-react'
import { LikeBurst } from '@/components/like-burst'
import { BetaDisclaimer } from '@/components/beta-disclaimer'
import type { Lecture, Profile } from '@/lib/types'

const FLAG_SUBJECTS: Record<string, string> = {
  'CSBH': 'https://flagcdn.com/24x18/me.png',
  'Engleski': 'https://flagcdn.com/24x18/gb.png',
  'Italjanski': 'https://flagcdn.com/24x18/it.png',
  'Njemacki': 'https://flagcdn.com/24x18/de.png',
  'Spanski': 'https://flagcdn.com/24x18/es.png',
  'Izb_spanski': 'https://flagcdn.com/24x18/es.png',
}

const DEFAULT_SUBJECTS = [
  { name: 'Fizika', emoji: '⚛️' },
  { name: 'Matematika', emoji: '📐' },
  { name: 'CSBH', emoji: '🇲🇪' },
  { name: 'Hemija', emoji: '🧪' },
  { name: 'Engleski', emoji: '🇬🇧' },
  { name: 'Italjanski', emoji: '🇮🇹' },
  { name: 'Fizicko', emoji: '🏃' },
  { name: 'Likovno', emoji: '🎨' },
  { name: 'Biologija', emoji: '🧬' },
  { name: 'Istorija', emoji: '🏛️' },
  { name: 'Geografija', emoji: '🌍' },
]

const OPTIONAL_SUBJECTS = [
  { name: 'Njemacki', emoji: '🇩🇪' },
  { name: 'Spanski', emoji: '🇪🇸' },
  { name: 'Izb_spanski', emoji: '🇪🇸' },
]

function SubjectIcon({ name, emoji, size = 'lg' }: { name: string; emoji: string; size?: 'lg' | 'sm' }) {
  const flagUrl = FLAG_SUBJECTS[name]
  if (flagUrl) {
    const dims = size === 'lg' ? 'w-10 h-7' : 'w-6 h-4'
    return <img src={flagUrl} alt={name} className={`${dims} object-contain`} />
  }
  return <span className={size === 'lg' ? 'text-4xl' : 'text-xl'}>{emoji}</span>
}

type ViewState = 'subjects' | 'lectures' | 'lecture' | 'quiz'

interface QuizQuestion {
  question: string
  options: string[]
  correct: number
}

interface FlashCard {
  question: string
  answer: string
}

function parseQuizData(content: string): QuizQuestion[] | null {
  const quizMatch = content.match(/QUIZ_DATA:([\s\S]*?):QUIZ_DATA/)
  if (!quizMatch) return null
  try {
    const parsed = JSON.parse(quizMatch[1])
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].options) {
      return parsed
    }
  } catch {}
  return null
}

function generateFlashcards(lecture: Lecture): FlashCard[] {
  const quizMatch = lecture.content.match(/QUIZ_DATA:([\s\S]*?):QUIZ_DATA/)
  if (quizMatch) {
    try {
      const parsed = JSON.parse(quizMatch[1])
      if (parsed.flashcards && parsed.flashcards.length > 0) {
        return parsed.flashcards
      }
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].question) {
        return parsed.map((q: any) => ({
          question: q.question,
          answer: q.options?.[q.correct] || q.answer || 'Pogledaj lekciju za odgovor',
        }))
      }
    } catch {}
  }

  const lines = lecture.content.split('\n').filter(l => l.trim().length > 20)
  const cards: FlashCard[] = []

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim()
    if (line.includes(':') || line.includes('-') || line.includes('–')) {
      const sep = line.includes(':') ? ':' : line.includes('–') ? '–' : '-'
      const parts = line.split(sep)
      if (parts.length >= 2 && parts[0].trim().length > 3) {
        cards.push({
          question: parts[0].trim().replace(/^[-•*]\s*/, ''),
          answer: parts.slice(1).join(sep).trim(),
        })
      }
    }
  }

  if (cards.length === 0) {
    cards.push({
      question: `Šta je glavna tema lekcije "${lecture.title}"?`,
      answer: `Ova lekcija pokriva temu: ${lecture.subject} - ${lecture.title}`,
    })
  }

  return cards
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

function stripQuizData(html: string): string {
  // Remove QUIZ_DATA blocks (with or without proper closing)
  let result = html.replace(/\n*QUIZ_DATA:[\s\S]*?:QUIZ_DATA\n*/g, '')
  // Fallback: if QUIZ_DATA: is still present (broken closing), strip everything after it
  const idx = result.indexOf('QUIZ_DATA:')
  if (idx !== -1) result = result.substring(0, idx).trim()
  return result
}

export default function LecturesPage() {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [view, setView] = useState<ViewState>('subjects')
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null)
  const [loading, setLoading] = useState(true)
  const [extraSubjects, setExtraSubjects] = useState<string[]>([])
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [flashcards, setFlashcards] = useState<FlashCard[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [likedLectures, setLikedLectures] = useState<Record<string, boolean>>({})
  const [likeBurst, setLikeBurst] = useState<{ x: number; y: number; key: number } | null>(null)
  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizCurrent, setQuizCurrent] = useState(0)
  const [quizSelected, setQuizSelected] = useState<number | null>(null)
  const [quizAnswered, setQuizAnswered] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [quizFinished, setQuizFinished] = useState(false)
  const [activeSection, setActiveSection] = useState<'content' | 'video' | 'quiz'>('content')
  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem('extra_subjects')
    if (saved) setExtraSubjects(JSON.parse(saved))
    const savedLikes = localStorage.getItem('lecture_likes')
    if (savedLikes) setLikedLectures(JSON.parse(savedLikes))
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (profileData) setProfile(profileData)
    }
    setLoading(false)
  }

  const loadLectures = useCallback(async (subject: string) => {
    if (!profile) return
    const { data, error } = await supabase
      .from('lectures')
      .select('*')
      .eq('class_number', profile.class_number)
      .eq('subject', subject)
      .order('created_at', { ascending: false })
    if (data) {
      setLectures(data)
    }
  }, [profile])

  function handleSubjectTap(subject: string) {
    setSelectedSubject(subject)
    setView('lectures')
    loadLectures(subject)
  }

  function handleLectureTap(lecture: Lecture) {
    setSelectedLecture(lecture)
    setActiveSection('content')
    setView('lecture')
  }

  function handleQuiz(lecture: Lecture) {
    const mcq = parseQuizData(lecture.content)
    if (mcq && mcq.length > 0) {
      setQuizQuestions(mcq)
      setQuizCurrent(0)
      setQuizSelected(null)
      setQuizAnswered(false)
      setQuizScore(0)
      setQuizFinished(false)
      setView('quiz')
    } else {
      // Fallback to flashcards
      const cards = generateFlashcards(lecture)
      setFlashcards(cards)
      setCurrentCard(0)
      setFlipped(false)
      setQuizQuestions([])
      setView('quiz')
    }
  }

  function handleQuizAnswer(optionIdx: number) {
    if (quizAnswered) return
    setQuizSelected(optionIdx)
    setQuizAnswered(true)
    if (optionIdx === quizQuestions[quizCurrent].correct) {
      setQuizScore(s => s + 1)
    }
  }

  function handleQuizNext() {
    if (quizCurrent + 1 >= quizQuestions.length) {
      setQuizFinished(true)
    } else {
      setQuizCurrent(c => c + 1)
      setQuizSelected(null)
      setQuizAnswered(false)
    }
  }

  function goBack() {
    if (view === 'quiz') {
      setView('lecture')
    } else if (view === 'lecture') {
      setView('lectures')
      setSelectedLecture(null)
    } else if (view === 'lectures') {
      setView('subjects')
      setSelectedSubject(null)
    }
  }

  function navigateLecture(direction: 'prev' | 'next') {
    if (!selectedLecture) return
    const currentIdx = lectures.findIndex(l => l.id === selectedLecture.id)
    const nextIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1
    if (nextIdx >= 0 && nextIdx < lectures.length) {
      setSelectedLecture(lectures[nextIdx])
      setActiveSection('content')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const currentLectureIndex = useMemo(() => {
    if (!selectedLecture) return -1
    return lectures.findIndex(l => l.id === selectedLecture.id)
  }, [selectedLecture, lectures])

  function addSubject(name: string) {
    const updated = [...extraSubjects, name]
    setExtraSubjects(updated)
    localStorage.setItem('extra_subjects', JSON.stringify(updated))
  }

  function removeSubject(name: string) {
    const updated = extraSubjects.filter(s => s !== name)
    setExtraSubjects(updated)
    localStorage.setItem('extra_subjects', JSON.stringify(updated))
  }

  function toggleLike(lectureId: string, e?: React.MouseEvent) {
    const updated = { ...likedLectures }
    if (updated[lectureId]) {
      delete updated[lectureId]
    } else {
      updated[lectureId] = true
      if (e) {
        setLikeBurst({ x: e.clientX - 20, y: e.clientY - 20, key: Date.now() })
      }
    }
    setLikedLectures(updated)
    localStorage.setItem('lecture_likes', JSON.stringify(updated))
  }

  const allSubjects = [
    ...DEFAULT_SUBJECTS,
    ...OPTIONAL_SUBJECTS.filter(s => extraSubjects.includes(s.name)),
  ]

  const availableOptional = OPTIONAL_SUBJECTS.filter(s => !extraSubjects.includes(s.name))

  // ========== QUIZ VIEW (MULTIPLE CHOICE) ==========
  if (view === 'quiz' && selectedLecture) {
    // Multiple-choice quiz
    if (quizQuestions.length > 0) {
      if (quizFinished) {
        const percentage = Math.round((quizScore / quizQuestions.length) * 100)
        const emoji = percentage >= 80 ? '🏆' : percentage >= 60 ? '👍' : percentage >= 40 ? '📚' : '💪'
        return (
          <div className="space-y-6 animate-fade-in">
            <button onClick={goBack} className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all">
              <ChevronLeft className="w-4 h-4" /> Nazad na lekciju
            </button>
            <div className="text-center space-y-4 py-8">
              <div className="text-6xl">{emoji}</div>
              <h1 className="text-2xl font-bold gradient-text">Kviz završen!</h1>
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
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
                  <span className="text-3xl font-bold">{quizScore}</span>
                  <span className="text-xs text-muted-foreground">od {quizQuestions.length}</span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                {percentage >= 80 ? 'Odlično! Savladao/la si ovu lekciju!' :
                 percentage >= 60 ? 'Dobro! Još malo vježbe i biće savršeno.' :
                 'Probaj ponovo nakon što ponoviš lekciju.'}
              </p>
              <div className="flex gap-3 justify-center pt-4">
                <button
                  onClick={() => { setQuizCurrent(0); setQuizSelected(null); setQuizAnswered(false); setQuizScore(0); setQuizFinished(false) }}
                  className="px-5 py-2.5 rounded-xl bg-muted text-sm font-medium flex items-center gap-2 transition-all active:scale-95 hover:bg-muted/80"
                >
                  <RotateCcw className="w-4 h-4" /> Ponovo
                </button>
                <button
                  onClick={goBack}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all active:scale-95"
                >
                  Nazad na lekciju
                </button>
              </div>
            </div>
          </div>
        )
      }

      const q = quizQuestions[quizCurrent]
      return (
        <div className="space-y-5 animate-fade-in">
          <button onClick={goBack} className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all">
            <ChevronLeft className="w-4 h-4" /> Nazad na lekciju
          </button>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold gradient-text">Provjeri znanje</h1>
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {quizCurrent + 1} / {quizQuestions.length}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-600 transition-all duration-500"
                style={{ width: `${((quizCurrent + (quizAnswered ? 1 : 0)) / quizQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          <Card className="border-border/30 bg-card/50 backdrop-blur">
            <CardContent className="p-5 space-y-4">
              <p className="text-base font-medium leading-relaxed">{q.question}</p>

              <div className="space-y-2.5">
                {q.options.map((option, idx) => {
                  let cardClass = 'border border-border/40 bg-background/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
                  if (quizAnswered) {
                    if (idx === q.correct) {
                      cardClass = 'border-2 border-green-500/60 bg-green-500/10'
                    } else if (idx === quizSelected && idx !== q.correct) {
                      cardClass = 'border-2 border-red-500/60 bg-red-500/10'
                    } else {
                      cardClass = 'border border-border/20 bg-background/30 opacity-50'
                    }
                  } else if (idx === quizSelected) {
                    cardClass = 'border-2 border-primary bg-primary/10'
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuizAnswer(idx)}
                      disabled={quizAnswered}
                      className={`w-full text-left p-3.5 rounded-xl transition-all duration-300 flex items-center gap-3 ${cardClass}`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        quizAnswered && idx === q.correct ? 'bg-green-500 text-white' :
                        quizAnswered && idx === quizSelected ? 'bg-red-500 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {quizAnswered && idx === q.correct ? <CheckCircle2 className="w-4 h-4" /> :
                         quizAnswered && idx === quizSelected && idx !== q.correct ? <XCircle className="w-4 h-4" /> :
                         String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm">{option}</span>
                    </button>
                  )
                })}
              </div>

              {quizAnswered && (
                <div className="pt-2 animate-fade-in">
                  <button
                    onClick={handleQuizNext}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 text-white font-medium text-sm transition-all active:scale-[0.98]"
                  >
                    {quizCurrent + 1 >= quizQuestions.length ? 'Pogledaj rezultat' : 'Sljedeće pitanje →'}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Score tracker */}
          <div className="flex justify-center gap-1.5">
            {quizQuestions.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === quizCurrent ? 'bg-primary scale-125 ring-2 ring-primary/30' :
                  i < quizCurrent ? 'bg-primary/50' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      )
    }

    // Fallback: flashcard quiz
    const card = flashcards[currentCard]
    return (
      <div className="space-y-6 animate-fade-in">
        <button onClick={goBack} className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all">
          <ChevronLeft className="w-4 h-4" /> Nazad na lekciju
        </button>
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold gradient-text">Provjeri znanje</h1>
          <p className="text-xs text-muted-foreground">{selectedLecture.title}</p>
          <p className="text-xs text-muted-foreground">{currentCard + 1} / {flashcards.length}</p>
        </div>
        {card && (
          <div
            className="relative min-h-[220px] cursor-pointer [perspective:800px]"
            onClick={() => {
              if (flipped) {
                // Advance to next card (or loop back)
                setFlipped(false)
                if (currentCard < flashcards.length - 1) {
                  setCurrentCard(currentCard + 1)
                } else {
                  setCurrentCard(0)
                }
              } else {
                setFlipped(true)
              }
            }}
          >
            <div
              className="w-full min-h-[220px] transition-transform duration-500 [transform-style:preserve-3d]"
              style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              {/* Front - Question */}
              <div className="absolute inset-0 [backface-visibility:hidden]">
                <Card className="border-border/30 bg-card/50 backdrop-blur min-h-[220px] flex items-center justify-center h-full">
                  <CardContent className="p-6 text-center space-y-4">
                    <Brain className="w-8 h-8 mx-auto text-primary opacity-60" />
                    <p className="text-lg font-medium leading-relaxed">{card.question}</p>
                    <p className="text-xs text-muted-foreground">Tapni za odgovor</p>
                  </CardContent>
                </Card>
              </div>
              {/* Back - Answer */}
              <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <Card className="border-border/30 bg-card/50 backdrop-blur min-h-[220px] flex items-center justify-center h-full">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-8 h-8 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-400 text-lg">✓</span>
                    </div>
                    <p className="text-lg font-medium text-green-400 leading-relaxed">{card.answer}</p>
                    <p className="text-xs text-muted-foreground">Tapni za sljedeće pitanje</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-2 justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); setFlipped(false); setCurrentCard(Math.max(0, currentCard - 1)) }}
            disabled={currentCard === 0 && !flipped}
            className="px-4 py-2 rounded-xl bg-muted text-sm disabled:opacity-30 transition-all active:scale-95"
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
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm transition-all active:scale-95"
          >
            {!flipped ? 'Otkrij' : currentCard === flashcards.length - 1 ? (
              <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Ponovo</span>
            ) : 'Sljedeće →'}
          </button>
        </div>
        <div className="flex justify-center gap-1.5">
          {flashcards.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${
              i === currentCard ? 'bg-primary scale-125' : i < currentCard ? 'bg-primary/40' : 'bg-muted'
            }`} />
          ))}
        </div>
      </div>
    )
  }

  // ========== LECTURE DETAIL VIEW (PREMIUM) ==========
  if (view === 'lecture' && selectedLecture) {
    const hasVideo = selectedLecture.video_url && getYouTubeId(selectedLecture.video_url)
    const hasQuiz = !!parseQuizData(selectedLecture.content) || true
    const isCurrent = selectedLecture.content.includes('<!-- CURRENT -->')
    const cleanContent = stripQuizData(selectedLecture.content).replace('<!-- CURRENT -->', '')

    return (
      <div className="space-y-4 animate-fade-in">
        {likeBurst && (
          <LikeBurst key={likeBurst.key} x={likeBurst.x} y={likeBurst.y} onDone={() => setLikeBurst(null)} />
        )}

        {/* Header */}
        <button onClick={goBack} className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all">
          <ChevronLeft className="w-4 h-4" /> Nazad
        </button>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{selectedLecture.subject}</Badge>
              {isCurrent && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 animate-pulse flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Trenutna lekcija
                </span>
              )}
            </div>
            <button
              onClick={(e) => toggleLike(selectedLecture.id, e)}
              className="flex items-center gap-1.5 transition-all duration-200 active:scale-110"
            >
              <ThumbsUp className={`w-5 h-5 transition-all ${
                likedLectures[selectedLecture.id] ? 'fill-blue-500 text-blue-500' : 'text-muted-foreground'
              }`} />
              <span className={`text-sm ${likedLectures[selectedLecture.id] ? 'text-blue-500' : 'text-muted-foreground'}`}>
                {likedLectures[selectedLecture.id] ? 1 : 0}
              </span>
            </button>
          </div>

          <h1 className="text-2xl font-bold leading-tight">{selectedLecture.title}</h1>

          {/* Progress indicator */}
          {lectures.length > 1 && currentLectureIndex >= 0 && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                Lekcija {currentLectureIndex + 1} od {lectures.length}
              </p>
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-violet-600 rounded-full transition-all duration-500"
                  style={{ width: `${((currentLectureIndex + 1) / lectures.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {profile?.class_number}-{profile?.section_number} · {new Date(selectedLecture.created_at).toLocaleDateString('sr-Latn')}
          </p>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
          <button
            onClick={() => setActiveSection('content')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              activeSection === 'content' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            📖 Lekcija
          </button>
          {hasVideo && (
            <button
              onClick={() => setActiveSection('video')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                activeSection === 'video' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🎬 Video
            </button>
          )}
          <button
            onClick={() => setActiveSection('quiz')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              activeSection === 'quiz' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🧠 Kviz
          </button>
        </div>

        {/* Content section */}
        {activeSection === 'content' && (
          <div className="animate-fade-in">
            <div className="prose prose-invert prose-sm max-w-none">
              {cleanContent.includes('<') ? (
                <div
                  className="text-foreground/90 leading-relaxed text-[15px]
                    [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:bg-gradient-to-r [&_h1]:from-purple-400 [&_h1]:to-violet-300 [&_h1]:bg-clip-text [&_h1]:text-transparent
                    [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-purple-300
                    [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4
                    [&_p]:mb-3 [&_p]:leading-7
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1
                    [&_li]:mb-1
                    [&_strong]:font-bold [&_strong]:text-foreground
                    [&_em]:italic
                    [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
                    [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
                    [&_img]:rounded-xl [&_img]:max-w-full
                    [&_hr]:border-border/30 [&_hr]:my-6"
                  dangerouslySetInnerHTML={{ __html: cleanContent }}
                />
              ) : (
                <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed text-[15px]">
                  {cleanContent}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Video section */}
        {activeSection === 'video' && selectedLecture.video_url && (
          <div className="animate-fade-in space-y-3">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border/30 bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${getYouTubeId(selectedLecture.video_url)}`}
                title={selectedLecture.title}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <a
              href={selectedLecture.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <Play className="w-3 h-3" /> Otvori na YouTube
            </a>
          </div>
        )}

        {/* Quiz section (inline) */}
        {activeSection === 'quiz' && (
          <div className="animate-fade-in space-y-4">
            <Card className="border-border/30 bg-gradient-to-br from-purple-500/10 to-violet-600/5 backdrop-blur">
              <CardContent className="p-5 text-center space-y-3">
                <Brain className="w-10 h-10 mx-auto text-purple-400" />
                <h3 className="text-lg font-bold">Provjeri znanje</h3>
                <p className="text-sm text-muted-foreground">Testiraj koliko si naučio/la iz ove lekcije</p>
                <button
                  onClick={() => handleQuiz(selectedLecture)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 text-white font-medium text-sm transition-all active:scale-[0.98] hover:shadow-lg hover:shadow-purple-500/20"
                >
                  Započni kviz →
                </button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quiz button */}
        <div className="pt-4 border-t border-border/30">
          <button
            onClick={() => handleQuiz(selectedLecture)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
          >
            <Brain className="w-5 h-5" /> Provjeri znanje
          </button>
        </div>
      </div>
    )
  }

  // ========== LECTURES LIST VIEW ==========
  if (view === 'lectures' && selectedSubject) {
    const subjectInfo = [...DEFAULT_SUBJECTS, ...OPTIONAL_SUBJECTS].find(s => s.name === selectedSubject)
    return (
      <div className="space-y-4 animate-fade-in">
        <button onClick={goBack} className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all">
          <ChevronLeft className="w-4 h-4" /> Svi predmeti
        </button>
        <div className="flex items-center gap-3">
          {subjectInfo && <SubjectIcon name={subjectInfo.name} emoji={subjectInfo.emoji} size="lg" />}
          <div>
            <h1 className="text-2xl font-bold">{selectedSubject}</h1>
            <p className="text-xs text-muted-foreground">{lectures.length} lekcija</p>
          </div>
        </div>

        {lectures.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nema lekcija za ovaj predmet</p>
          </div>
        ) : (
          <div className="space-y-2 animate-stagger">
            {lectures.map((lecture, idx) => {
              const isCurrent = lecture.content?.includes('<!-- CURRENT -->')
              return (
                <Card
                  key={lecture.id}
                  className={`border-border/30 bg-card/50 backdrop-blur cursor-pointer hover:bg-card/80 transition-all active:scale-[0.98] card-hover ${
                    isCurrent ? 'ring-1 ring-violet-500/50 bg-violet-500/5' : ''
                  }`}
                  onClick={() => handleLectureTap(lecture)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xs text-muted-foreground font-mono w-6 text-right flex-shrink-0">{idx + 1}</span>
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="font-medium text-sm flex items-center gap-2">
                          {lecture.title}
                          {isCurrent && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 whitespace-nowrap flex-shrink-0">
                              📍 OVDJE SI
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(lecture.created_at).toLocaleDateString('sr-Latn')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {likedLectures[lecture.id] && (
                        <ThumbsUp className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ========== LOADING ==========
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // ========== SUBJECTS GRID VIEW ==========
  return (
    <div className="space-y-4 animate-fade-in">
      <BetaDisclaimer />
      {profile && (
        <Badge variant="secondary" className="text-xs">
          Tvoj razred: {profile.class_number}-{profile.section_number}
        </Badge>
      )}

      <div className="grid grid-cols-2 gap-3 animate-stagger">
        {allSubjects.map((subject) => (
          <Card
            key={subject.name}
            className="border-border/30 bg-card/50 backdrop-blur cursor-pointer hover:bg-card/80 transition-all active:scale-[0.98] card-hover overflow-hidden gradient-overlay glow-hover"
            onClick={() => handleSubjectTap(subject.name)}
          >
            <CardContent className="p-5 flex flex-col items-center text-center gap-2.5">
              <SubjectIcon name={subject.name} emoji={subject.emoji} size="lg" />
              <h3 className="font-semibold text-sm">{subject.name}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      {availableOptional.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => {
              setShowAddSubject(!showAddSubject)
              if (!showAddSubject) {
                setTimeout(() => {
                  document.getElementById('add-subject-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 100)
              }
            }}
            className="w-full py-3 rounded-2xl border border-dashed border-border/50 text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-primary/50 hover:text-primary transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Dodaj predmet
          </button>

          {showAddSubject && (
            <div id="add-subject-list" className="space-y-2 animate-fade-in">
              {availableOptional.map((subject) => (
                <Card
                  key={subject.name}
                  className="border-border/30 bg-card/50 backdrop-blur cursor-pointer hover:bg-card/80 transition-all active:scale-[0.98]"
                  onClick={() => { addSubject(subject.name); setShowAddSubject(false) }}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <SubjectIcon name={subject.name} emoji={subject.emoji} size="sm" />
                    <span className="text-sm font-medium">{subject.name}</span>
                    <Plus className="w-4 h-4 text-primary ml-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {extraSubjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {extraSubjects.map((name) => (
            <button
              key={name}
              onClick={() => removeSubject(name)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground hover:text-destructive transition-all"
            >
              {name}
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
