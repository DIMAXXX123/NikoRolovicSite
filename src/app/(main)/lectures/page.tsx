'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
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
  return <span className={size === 'lg' ? 'text-5xl' : 'text-xl'}>{emoji}</span>
}

/** Convert math notation: x^2 → x², log_2 → log₂ */
function formatMath(text: string): string {
  if (!text) return ''
  const superscripts: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', 'n': 'ⁿ', 'x': 'ˣ', '+': '⁺', '-': '⁻' }
  const subscripts: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', 'n': 'ₙ', 'x': 'ₓ' }
  let result = text.replace(/\^([0-9n\+\-x]+)/g, (_, chars) =>
    chars.split('').map((c: string) => superscripts[c] || c).join('')
  )
  result = result.replace(/_([0-9nx]+)/g, (_, chars) =>
    chars.split('').map((c: string) => subscripts[c] || c).join('')
  )
  return result
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

interface KeyTerm {
  term: string
  definition: string
}

function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function parseLectureDate(content: string): string | null {
  const match = content.match(/LECTURE_DATE:(.*?):LECTURE_DATE/)
  return match ? match[1].trim() : null
}

function parseKeyTerms(content: string): KeyTerm[] {
  const match = content.match(/KEY_TERMS:([\s\S]*?):KEY_TERMS/)
  if (!match) return []
  try {
    return JSON.parse(match[1])
  } catch { return [] }
}

function parseSummary(content: string): string | null {
  const match = content.match(/SUMMARY:([\s\S]*?):SUMMARY/)
  return match ? match[1].trim() : null
}

function parseSections(content: string): { heading: string; content: string }[] {
  const sections: { heading: string; content: string }[] = []
  const lines = content.split('\n')
  let currentHeading = ''
  let currentContent: string[] = []

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentHeading || currentContent.length > 0) {
        sections.push({ heading: currentHeading, content: currentContent.join('\n').trim() })
      }
      currentHeading = line.replace('## ', '').trim()
      currentContent = []
    } else {
      currentContent.push(line)
    }
  }
  if (currentHeading || currentContent.length > 0) {
    sections.push({ heading: currentHeading, content: currentContent.join('\n').trim() })
  }
  return sections.filter(s => s.heading || s.content)
}

function parseQuizData(content: string): { questions: QuizQuestion[]; flashcards: FlashCard[] } | null {
  const quizMatch = content.match(/(?:<!--\s*)?QUIZ_DATA:([\s\S]*?):QUIZ_DATA(?:\s*-->)?/)
  if (!quizMatch) return null
  try {
    const parsed = JSON.parse(quizMatch[1])

    // New format: { questions: [...], flashcards: [...] }
    if (parsed.questions && Array.isArray(parsed.questions)) {
      return {
        questions: parsed.questions.map((q: any) => ({
          question: formatMath(stripHtml(q.question)),
          options: q.options.map((o: string) => formatMath(stripHtml(o))),
          correct: q.correct,
        })),
        flashcards: (parsed.flashcards || []).map((fc: any) => ({
          question: formatMath(stripHtml(fc.question || fc.front)),
          answer: formatMath(stripHtml(fc.answer || fc.back)),
        })),
      }
    }

    // Old format: array of MCQ questions
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].options) {
      return {
        questions: parsed.map((q: any) => ({
          question: formatMath(stripHtml(q.question)),
          options: q.options.map((o: string) => formatMath(stripHtml(o))),
          correct: q.correct,
        })),
        flashcards: [],
      }
    }

    // Old format: { flashcards: [...] }
    if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
      return {
        questions: [],
        flashcards: parsed.flashcards.map((fc: any) => ({
          question: formatMath(stripHtml(fc.question)),
          answer: formatMath(stripHtml(fc.answer)),
        })),
      }
    }
  } catch {}
  return null
}

function stripMetadata(html: string): string {
  let result = html
  result = result.replace(/\n*(?:<!--\s*)?QUIZ_DATA:[\s\S]*?:QUIZ_DATA(?:\s*-->)?\n*/g, '')
  result = result.replace(/\n*KEY_TERMS:[\s\S]*?:KEY_TERMS\n*/g, '')
  result = result.replace(/\n*SUMMARY:[\s\S]*?:SUMMARY\n*/g, '')
  result = result.replace(/\n*LECTURE_DATE:[\s\S]*?:LECTURE_DATE\n*/g, '')
  result = result.replace('<!-- CURRENT -->', '')
  // Fallback cleanup
  const idx = result.indexOf('QUIZ_DATA:')
  if (idx !== -1) result = result.substring(0, idx).trim()
  const idx2 = result.indexOf('<!--QUIZ_DATA')
  if (idx2 !== -1) result = result.substring(0, idx2).trim()
  return result.trim()
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

// ========== QUIZ TIMER COMPONENT ==========
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
          cx="22" cy="22" r={radius}
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
        <span className={`text-sm font-bold ${seconds <= 5 ? 'text-red-400' : 'text-foreground'}`}>{seconds}</span>
      </div>
    </div>
  )
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
  const [likedLectures, setLikedLectures] = useState<Record<string, boolean>>({})
  const [likeBurst, setLikeBurst] = useState<{ x: number; y: number; key: number } | null>(null)

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizCurrent, setQuizCurrent] = useState(0)
  const [quizSelected, setQuizSelected] = useState<number | null>(null)
  const [quizAnswered, setQuizAnswered] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [quizFinished, setQuizFinished] = useState(false)
  const [quizTimer, setQuizTimer] = useState(15)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Flashcard state
  const [flashcards, setFlashcards] = useState<FlashCard[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [quizMode, setQuizMode] = useState<'quiz' | 'flashcards'>('quiz')

  const [activeSection, setActiveSection] = useState<'content' | 'video' | 'quiz'>('content')
  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem('extra_subjects')
    if (saved) setExtraSubjects(JSON.parse(saved))
    const savedLikes = localStorage.getItem('lecture_likes')
    if (savedLikes) setLikedLectures(JSON.parse(savedLikes))
    loadData()
  }, [])

  // Quiz timer effect
  useEffect(() => {
    if (view === 'quiz' && quizQuestions.length > 0 && !quizAnswered && !quizFinished) {
      setQuizTimer(15)
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setQuizTimer(prev => {
          if (prev <= 1) {
            // Time's up - auto-answer wrong
            if (timerRef.current) clearInterval(timerRef.current)
            setQuizAnswered(true)
            setQuizSelected(-1) // no selection
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [view, quizCurrent, quizQuestions.length, quizFinished])

  // Stop timer when answered
  useEffect(() => {
    if (quizAnswered && timerRef.current) {
      clearInterval(timerRef.current)
    }
  }, [quizAnswered])

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
    const { data } = await supabase
      .from('lectures')
      .select('*')
      .eq('class_number', profile.class_number)
      .eq('subject', subject)
      .order('created_at', { ascending: false })
    if (data) setLectures(data)
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
    const parsed = parseQuizData(lecture.content)
    if (parsed && parsed.questions.length > 0) {
      setQuizQuestions(parsed.questions)
      setFlashcards(parsed.flashcards)
      setQuizCurrent(0)
      setQuizSelected(null)
      setQuizAnswered(false)
      setQuizScore(0)
      setQuizFinished(false)
      setQuizMode('quiz')
      setView('quiz')
      return
    }
    if (parsed && parsed.flashcards.length > 0) {
      setFlashcards(parsed.flashcards)
      setQuizQuestions([])
      setCurrentCard(0)
      setFlipped(false)
      setQuizMode('flashcards')
      setView('quiz')
      return
    }
    setQuizQuestions([])
    setFlashcards([])
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
      if (timerRef.current) clearInterval(timerRef.current)
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

  // ========== QUIZ VIEW ==========
  if (view === 'quiz' && selectedLecture) {
    // Mode switcher (if both quiz and flashcards available)
    const hasQuiz = quizQuestions.length > 0
    const hasFlashcards = flashcards.length > 0
    const showModeSwitcher = hasQuiz && hasFlashcards

    // ===== FLASHCARDS MODE =====
    if (quizMode === 'flashcards' && hasFlashcards) {
      const card = flashcards[currentCard]
      return (
        <div className="space-y-6 animate-fade-in">
          <button onClick={goBack} className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all">
            <ChevronLeft className="w-4 h-4" /> Nazad na lekciju
          </button>
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold gradient-text">Kartice za učenje</h1>
            <p className="text-xs text-muted-foreground">{selectedLecture.title}</p>
            <p className="text-xs text-muted-foreground">{currentCard + 1} / {flashcards.length}</p>
          </div>

          {showModeSwitcher && (
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
              <button onClick={() => { setQuizMode('quiz'); setQuizCurrent(0); setQuizSelected(null); setQuizAnswered(false); setQuizScore(0); setQuizFinished(false) }}
                className="flex-1 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-all">
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
                {/* Front */}
                <div className="absolute inset-0 [backface-visibility:hidden]">
                  <Card className="border-border/30 bg-card/50 backdrop-blur min-h-[240px] flex items-center justify-center h-full">
                    <CardContent className="p-6 text-center space-y-4">
                      <Brain className="w-8 h-8 mx-auto text-primary opacity-60" />
                      <p className="text-lg font-medium leading-relaxed">{card.question}</p>
                      <p className="text-xs text-muted-foreground">Tapni za odgovor</p>
                    </CardContent>
                  </Card>
                </div>
                {/* Back */}
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

          {/* Navigation buttons */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={(e) => { e.stopPropagation(); setFlipped(false); setCurrentCard(Math.max(0, currentCard - 1)) }}
              disabled={currentCard === 0 && !flipped}
              className="px-4 py-2.5 rounded-xl bg-muted text-sm disabled:opacity-30 transition-all active:scale-95"
            >
              ← Prethodno
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (!flipped) { setFlipped(true) }
                else if (currentCard < flashcards.length - 1) { setFlipped(false); setCurrentCard(currentCard + 1) }
                else { setFlipped(false); setCurrentCard(0) }
              }}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm transition-all active:scale-95"
            >
              {!flipped ? 'Otkrij' : currentCard === flashcards.length - 1 ? (
                <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Ponovo</span>
              ) : 'Sljedeće →'}
            </button>
          </div>

          {/* Card progress dots */}
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

    // ===== QUIZ MODE (MCQ with timer) =====
    if (hasQuiz) {
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
                  <span className="text-3xl font-bold">{percentage}%</span>
                  <span className="text-xs text-muted-foreground">{quizScore} od {quizQuestions.length}</span>
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
                {hasFlashcards && (
                  <button
                    onClick={() => { setQuizMode('flashcards'); setCurrentCard(0); setFlipped(false) }}
                    className="px-5 py-2.5 rounded-xl bg-muted text-sm font-medium flex items-center gap-2 transition-all active:scale-95 hover:bg-muted/80"
                  >
                    <Brain className="w-4 h-4" /> Kartice
                  </button>
                )}
                <button
                  onClick={goBack}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all active:scale-95"
                >
                  Nazad
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
              <div className="flex items-center gap-2">
                <QuizTimer seconds={quizTimer} total={15} />
                <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  {quizCurrent + 1} / {quizQuestions.length}
                </span>
              </div>
            </div>

            {showModeSwitcher && (
              <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
                <button className="flex-1 py-2 rounded-lg text-xs font-medium bg-background text-foreground shadow-sm">
                  Kviz
                </button>
                <button onClick={() => { setQuizMode('flashcards'); setCurrentCard(0); setFlipped(false) }}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-all">
                  Kartice
                </button>
              </div>
            )}

            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7c5cfc] to-[#5b3fd9] transition-all duration-500"
                style={{ width: `${((quizCurrent + (quizAnswered ? 1 : 0)) / quizQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          <Card className="border-border/30 bg-card/50 backdrop-blur">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-full bg-[#7c5cfc]/20 text-[#7c5cfc] text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {quizCurrent + 1}
                </span>
                <p className="text-base font-medium leading-relaxed pt-1">{q.question}</p>
              </div>

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
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7c5cfc] to-[#5b3fd9] text-white font-medium text-sm transition-all active:scale-[0.98]"
                  >
                    {quizCurrent + 1 >= quizQuestions.length ? 'Pogledaj rezultat' : 'Sljedeće pitanje →'}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

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

    // No quiz data fallback
    return (
      <div className="space-y-6 animate-fade-in text-center py-12">
        <Brain className="w-12 h-12 mx-auto text-muted-foreground/30" />
        <p className="text-muted-foreground">Kviz za ovu lekciju još nije dodat</p>
        <button onClick={goBack} className="px-5 py-2.5 rounded-xl bg-muted text-sm font-medium transition-all active:scale-95">
          Nazad
        </button>
      </div>
    )
  }

  // ========== LECTURE DETAIL VIEW ==========
  if (view === 'lecture' && selectedLecture) {
    const hasVideo = selectedLecture.video_url && getYouTubeId(selectedLecture.video_url)
    const quizData = parseQuizData(selectedLecture.content)
    const hasQuizContent = quizData && (quizData.questions.length > 0 || quizData.flashcards.length > 0)
    const isCurrent = selectedLecture.content.includes('<!-- CURRENT -->')
    const cleanContent = stripMetadata(selectedLecture.content)
    const lectureDate = parseLectureDate(selectedLecture.content)
    const keyTerms = parseKeyTerms(selectedLecture.content)
    const summary = parseSummary(selectedLecture.content)
    const sections = parseSections(cleanContent)
    const hasSections = sections.some(s => s.heading)

    return (
      <div className="space-y-4 animate-fade-in">
        {likeBurst && (
          <LikeBurst key={likeBurst.key} x={likeBurst.x} y={likeBurst.y} onDone={() => setLikeBurst(null)} />
        )}

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

          <h1 className="text-2xl font-bold leading-tight">{formatMath(selectedLecture.title)}</h1>

          {lectures.length > 1 && currentLectureIndex >= 0 && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                Lekcija {currentLectureIndex + 1} od {lectures.length}
              </p>
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7c5cfc] to-[#5b3fd9] rounded-full transition-all duration-500"
                  style={{ width: `${((currentLectureIndex + 1) / lectures.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {profile?.class_number}-{profile?.section_number} · {
              lectureDate
                ? new Date(lectureDate).toLocaleDateString('sr-Latn')
                : new Date(selectedLecture.created_at).toLocaleDateString('sr-Latn')
            }
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
          <div className="animate-fade-in space-y-4">
            {/* Sections with accent border */}
            {hasSections ? (
              <div className="space-y-4">
                {sections.map((section, i) => (
                  <div key={i} className="border-l-2 border-[#7c5cfc] pl-4">
                    {section.heading && (
                      <h2 className="text-lg font-semibold text-[#7c5cfc] mb-2">{formatMath(section.heading)}</h2>
                    )}
                    {section.content.includes('<') ? (
                      <div
                        className="text-foreground/90 leading-relaxed text-[15px]
                          [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4
                          [&_p]:mb-3 [&_p]:leading-7
                          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1
                          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1
                          [&_li]:mb-1
                          [&_strong]:font-bold [&_strong]:text-foreground
                          [&_em]:italic
                          [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
                          [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
                          [&_img]:rounded-xl [&_img]:max-w-full"
                        dangerouslySetInnerHTML={{ __html: section.content }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed text-[15px]">
                        {formatMath(section.content)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none">
                {cleanContent.includes('<') ? (
                  <div
                    className="text-foreground/90 leading-relaxed text-[15px]
                      [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:bg-gradient-to-r [&_h1]:from-[#7c5cfc] [&_h1]:to-[#a78bfa] [&_h1]:bg-clip-text [&_h1]:text-transparent
                      [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-[#7c5cfc]
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
                    {formatMath(cleanContent)}
                  </div>
                )}
              </div>
            )}

            {/* Key terms */}
            {keyTerms.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Ključni pojmovi</h3>
                <div className="flex flex-wrap gap-2">
                  {keyTerms.map((term, i) => (
                    <div key={i} className="group relative">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#7c5cfc]/10 text-[#7c5cfc] text-xs font-medium border border-[#7c5cfc]/20 cursor-help"
                        title={term.definition}>
                        {formatMath(term.term)}
                      </span>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl bg-[#0c0c14] border border-[#1a1a2e] text-xs text-foreground/80 max-w-[200px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                        {formatMath(term.definition)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {summary && (
              <div className="rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📝</span>
                  <h3 className="text-sm font-semibold">Rezime</h3>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{formatMath(summary)}</p>
              </div>
            )}
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
            <Card className="border-border/30 bg-gradient-to-br from-[#7c5cfc]/10 to-[#5b3fd9]/5 backdrop-blur">
              <CardContent className="p-5 text-center space-y-3">
                <Brain className="w-10 h-10 mx-auto text-[#7c5cfc]" />
                {hasQuizContent ? (
                  <>
                    <h3 className="text-lg font-bold">Provjeri znanje</h3>
                    <p className="text-sm text-muted-foreground">Testiraj koliko si naučio/la iz ove lekcije</p>
                    <button
                      onClick={() => handleQuiz(selectedLecture)}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7c5cfc] to-[#5b3fd9] text-white font-medium text-sm transition-all active:scale-[0.98] hover:shadow-lg hover:shadow-[#7c5cfc]/20"
                    >
                      Započni kviz →
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold">Kviz uskoro</h3>
                    <p className="text-sm text-muted-foreground">Kviz za ovu lekciju još nije dodat</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bottom quiz button */}
        {hasQuizContent && (
          <div className="pt-4 border-t border-border/30">
            <button
              onClick={() => handleQuiz(selectedLecture)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7c5cfc] to-[#5b3fd9] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(124,92,252,0.3)] hover:shadow-[0_0_30px_rgba(124,92,252,0.5)]"
            >
              <Brain className="w-5 h-5" /> Provjeri znanje
            </button>
          </div>
        )}
      </div>
    )
  }

  // ========== LECTURES LIST VIEW ==========
  if (view === 'lectures' && selectedSubject) {
    const subjectInfo = [...DEFAULT_SUBJECTS, ...OPTIONAL_SUBJECTS].find(s => s.name === selectedSubject)
    return (
      <div className="space-y-5 animate-fade-in pb-4">
        <button onClick={goBack} className="text-sm text-[#7c5cfc] flex items-center gap-1 hover:gap-2 transition-all font-medium">
          <ChevronLeft className="w-4 h-4" /> Svi predmeti
        </button>
        <div className="flex items-center gap-4">
          {subjectInfo && (
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <SubjectIcon name={subjectInfo.name} emoji={subjectInfo.emoji} size="lg" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{selectedSubject}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{lectures.length} lekcija</p>
          </div>
        </div>

        {lectures.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="w-16 h-16 rounded-3xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 opacity-30" />
            </div>
            <p className="text-sm">Nema lekcija za ovaj predmet</p>
          </div>
        ) : (
          <div className="space-y-2.5 animate-stagger">
            {lectures.map((lecture, idx) => {
              const isCurrent = lecture.content?.includes('<!-- CURRENT -->')
              const lDate = parseLectureDate(lecture.content)
              return (
                <button
                  key={lecture.id}
                  className={`w-full text-left rounded-2xl border bg-[#0c0c14] cursor-pointer hover:bg-white/[0.04] transition-all active:scale-[0.98] p-4 flex items-center justify-between ${
                    isCurrent ? 'border-violet-500/30 bg-violet-500/5' : 'border-[#1a1a2e]'
                  }`}
                  onClick={() => handleLectureTap(lecture)}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <span className={`text-xs font-mono w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isCurrent ? 'bg-violet-500/15 text-violet-400 font-bold' : 'bg-white/[0.04] text-muted-foreground'
                    }`}>{idx + 1}</span>
                    <div className="space-y-0.5 min-w-0">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        {formatMath(lecture.title)}
                        {isCurrent && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/20 whitespace-nowrap flex-shrink-0">
                            📍 OVDJE SI
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {lDate
                          ? new Date(lDate).toLocaleDateString('sr-Latn')
                          : new Date(lecture.created_at).toLocaleDateString('sr-Latn')
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {likedLectures[lecture.id] && (
                      <ThumbsUp className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                </button>
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
      <div className="space-y-5 pt-2">
        <div className="space-y-1">
          <div className="h-8 w-32 skeleton" />
          <div className="h-4 w-48 skeleton" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 rounded-2xl skeleton" />
          ))}
        </div>
      </div>
    )
  }

  // ========== SUBJECTS GRID VIEW ==========
  return (
    <div className="space-y-5 animate-fade-in pb-4">
      <BetaDisclaimer />

      <div className="pt-1">
        <h1 className="text-2xl font-bold gradient-text">Lekcije</h1>
        {profile && (
          <p className="text-xs text-muted-foreground mt-1">
            {profile.class_number}. razred, {profile.section_number}. odjeljenje
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 animate-stagger">
        {allSubjects.map((subject) => (
          <button
            key={subject.name}
            className="relative rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] cursor-pointer hover:bg-white/[0.05] hover:border-[#7c5cfc]/20 transition-all duration-300 active:scale-[0.96] overflow-hidden group p-5 flex flex-col items-center text-center gap-3"
            onClick={() => handleSubjectTap(subject.name)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#7c5cfc]/[0.03] to-[#5b3fd9]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative transition-transform duration-300 group-hover:scale-110">
              <SubjectIcon name={subject.name} emoji={subject.emoji} size="lg" />
            </div>
            <h3 className="relative font-semibold text-sm">{subject.name}</h3>
          </button>
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
            className="w-full py-3.5 rounded-2xl border border-dashed border-white/[0.08] text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-[#7c5cfc]/30 hover:text-[#7c5cfc] transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Dodaj predmet
          </button>

          {showAddSubject && (
            <div id="add-subject-list" className="space-y-2 animate-fade-in">
              {availableOptional.map((subject) => (
                <button
                  key={subject.name}
                  className="w-full rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] cursor-pointer hover:bg-white/[0.04] transition-all active:scale-[0.98] p-3.5 flex items-center gap-3"
                  onClick={() => { addSubject(subject.name); setShowAddSubject(false) }}
                >
                  <SubjectIcon name={subject.name} emoji={subject.emoji} size="sm" />
                  <span className="text-sm font-semibold">{subject.name}</span>
                  <Plus className="w-4 h-4 text-[#7c5cfc] ml-auto" />
                </button>
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-muted-foreground hover:text-red-400 hover:border-red-500/20 transition-all"
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
