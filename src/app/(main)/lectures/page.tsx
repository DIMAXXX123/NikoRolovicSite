'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ChevronRight, ChevronLeft, Plus, X, Play, Brain, RotateCcw, ThumbsUp } from 'lucide-react'
import { LikeBurst } from '@/components/like-burst'
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

interface FlashCard {
  question: string
  answer: string
}

function generateFlashcards(lecture: Lecture): FlashCard[] {
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
    const sentences = lecture.content.split(/[.!?]+/).filter(s => s.trim().length > 15).slice(0, 4)
    sentences.forEach((s, i) => {
      const trimmed = s.trim()
      const words = trimmed.split(' ')
      if (words.length >= 4) {
        const blankIdx = Math.floor(words.length / 2)
        const answer = words[blankIdx]
        const question = words.map((w, j) => j === blankIdx ? '______' : w).join(' ')
        cards.push({ question, answer })
      }
    })
  }

  if (cards.length === 0) {
    cards.push({
      question: `Šta je glavna tema lekcije "${lecture.title}"?`,
      answer: `Ova lekcija pokriva temu: ${lecture.subject} - ${lecture.title}`,
    })
  }

  return cards
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
    setView('lecture')
  }

  function handleQuiz(lecture: Lecture) {
    const cards = generateFlashcards(lecture)
    setFlashcards(cards)
    setCurrentCard(0)
    setFlipped(false)
    setView('quiz')
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

  function getLikeCount(lectureId: string): number {
    return likedLectures[lectureId] ? 1 : 0
  }

  const allSubjects = [
    ...DEFAULT_SUBJECTS,
    ...OPTIONAL_SUBJECTS.filter(s => extraSubjects.includes(s.name)),
  ]

  const subjectLectureCounts = lectures.length > 0 ? {} : {}
  // We don't have all counts preloaded; show them in the subject grid when available

  const availableOptional = OPTIONAL_SUBJECTS.filter(s => !extraSubjects.includes(s.name))

  // ========== QUIZ VIEW ==========
  if (view === 'quiz' && selectedLecture) {
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
            className="relative min-h-[220px] cursor-pointer perspective-1000"
            onClick={() => setFlipped(!flipped)}
          >
            <div className={`w-full min-h-[220px] transition-all duration-500 ${flipped ? 'animate-scale-in' : 'animate-fade-in'}`}>
              <Card className="border-border/30 bg-card/50 backdrop-blur min-h-[220px] flex items-center justify-center">
                <CardContent className="p-6 text-center space-y-4">
                  {!flipped ? (
                    <>
                      <Brain className="w-8 h-8 mx-auto text-primary opacity-60" />
                      <p className="text-lg font-medium leading-relaxed">{card.question}</p>
                      <p className="text-xs text-muted-foreground">Tapni za odgovor</p>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                        <span className="text-green-400 text-lg">✓</span>
                      </div>
                      <p className="text-lg font-medium text-green-400 leading-relaxed">{card.answer}</p>
                      <p className="text-xs text-muted-foreground">Tapni za sljedeće pitanje</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); setFlipped(false); setCurrentCard(Math.max(0, currentCard - 1)) }}
            disabled={currentCard === 0}
            className="px-4 py-2 rounded-xl bg-muted text-sm disabled:opacity-30 transition-all active:scale-95"
          >
            ← Prethodno
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (flipped && currentCard < flashcards.length - 1) {
                setFlipped(false)
                setCurrentCard(currentCard + 1)
              } else if (!flipped) {
                setFlipped(true)
              } else {
                setCurrentCard(0)
                setFlipped(false)
              }
            }}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm transition-all active:scale-95"
          >
            {flipped && currentCard === flashcards.length - 1 ? (
              <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Ponovo</span>
            ) : flipped ? 'Sljedeće →' : 'Otkrij'}
          </button>
        </div>

        {/* Progress dots */}
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

  // ========== LECTURE DETAIL VIEW ==========
  if (view === 'lecture' && selectedLecture) {
    return (
      <div className="space-y-4 animate-fade-in">
        {likeBurst && (
          <LikeBurst
            key={likeBurst.key}
            x={likeBurst.x}
            y={likeBurst.y}
            onDone={() => setLikeBurst(null)}
          />
        )}
        <button onClick={goBack} className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all">
          <ChevronLeft className="w-4 h-4" /> Nazad
        </button>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">{selectedLecture.subject}</Badge>
            <button
              onClick={(e) => toggleLike(selectedLecture.id, e)}
              className="flex items-center gap-1.5 transition-all duration-200 active:scale-110"
            >
              <ThumbsUp
                className={`w-5 h-5 transition-all ${
                  likedLectures[selectedLecture.id]
                    ? 'fill-blue-500 text-blue-500'
                    : 'text-muted-foreground'
                }`}
              />
              <span className={`text-sm ${likedLectures[selectedLecture.id] ? 'text-blue-500' : 'text-muted-foreground'}`}>
                {likedLectures[selectedLecture.id] ? 1 : 0}
              </span>
            </button>
          </div>
          <h1 className="text-2xl font-bold">{selectedLecture.title}</h1>
          <p className="text-xs text-muted-foreground">
            {profile?.class_number}-{profile?.section_number} · {new Date(selectedLecture.created_at).toLocaleDateString('sr-Latn')}
          </p>
        </div>
        <div className="prose prose-invert prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed text-sm">
            {selectedLecture.content}
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-border/30">
          <button
            onClick={() => handleQuiz(selectedLecture)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:shadow-lg hover:shadow-purple-500/20"
          >
            <Brain className="w-4 h-4" />
            Provjeri znanje
          </button>

          {selectedLecture.video_url && (
            <a
              href={selectedLecture.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-muted text-foreground font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:bg-muted/80"
            >
              <Play className="w-4 h-4" />
              Pogledaj video
            </a>
          )}
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
            {lectures.map((lecture) => (
              <Card
                key={lecture.id}
                className="border-border/30 bg-card/50 backdrop-blur cursor-pointer hover:bg-card/80 transition-all active:scale-[0.98] card-hover"
                onClick={() => handleLectureTap(lecture)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <h3 className="font-medium text-sm">{lecture.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(lecture.created_at).toLocaleDateString('sr-Latn')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {likedLectures[lecture.id] && (
                      <ThumbsUp className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
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

      {/* Add subject button */}
      {availableOptional.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowAddSubject(!showAddSubject)}
            className="w-full py-3 rounded-2xl border border-dashed border-border/50 text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-primary/50 hover:text-primary transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Dodaj predmet
          </button>

          {showAddSubject && (
            <div className="space-y-2 animate-fade-in">
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

      {/* Remove extra subjects */}
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
