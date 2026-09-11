'use client'

import { useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { Brain, Play } from 'lucide-react'
import type { FlashCard, QuizQuestion } from '../../lecture-utils'

// The quiz is a separate chunk — a reader who never opens it never downloads it.
const QuizRunner = dynamic(() => import('./quiz-runner').then((m) => m.QuizRunner), {
  loading: () => <div className="h-40 rounded-2xl skeleton" />,
})

interface LectureTabsProps {
  title: string
  videoUrl: string | null
  videoId: string | null
  questions: QuizQuestion[]
  flashcards: FlashCard[]
  /** Lecture body, rendered on the server and handed over as markup. */
  content: ReactNode
}

export function LectureTabs({
  title,
  videoUrl,
  videoId,
  questions,
  flashcards,
  content,
}: LectureTabsProps) {
  const [activeSection, setActiveSection] = useState<'content' | 'video' | 'quiz'>('content')
  const [quizOpen, setQuizOpen] = useState(false)

  const hasVideo = !!videoUrl && !!videoId
  const hasQuizContent = questions.length > 0 || flashcards.length > 0

  if (quizOpen) {
    return (
      <QuizRunner
        lectureTitle={title}
        questions={questions}
        flashcards={flashcards}
        onExit={() => setQuizOpen(false)}
      />
    )
  }

  const tabClass = (key: 'content' | 'video' | 'quiz') =>
    `flex-1 py-2 rounded-lg text-xs font-medium transition-all animate-press ${
      activeSection === key
        ? 'bg-background text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'
    }`

  return (
    <>
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
        <button onClick={() => setActiveSection('content')} className={tabClass('content')}>
          📖 Lekcija
        </button>
        {hasVideo && (
          <button onClick={() => setActiveSection('video')} className={tabClass('video')}>
            🎬 Video
          </button>
        )}
        <button onClick={() => setActiveSection('quiz')} className={tabClass('quiz')}>
          🧠 Kviz
        </button>
      </div>

      {/* Kept mounted so the server-rendered body is never thrown away. */}
      <div className="animate-fade-in" hidden={activeSection !== 'content'}>
        {content}
      </div>

      {activeSection === 'video' && hasVideo && (
        <div className="animate-fade-in space-y-3">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border/30 bg-black">
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
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <Play className="w-3 h-3" /> Otvori na YouTube
          </a>
        </div>
      )}

      {activeSection === 'quiz' && (
        <div className="animate-fade-in space-y-4">
          <Card className="border-border/30 bg-gradient-to-br from-[#7c5cfc]/10 to-[#5b3fd9]/5 backdrop-blur">
            <CardContent className="p-5 text-center space-y-3">
              <Brain className="w-10 h-10 mx-auto text-[#7c5cfc]" />
              {hasQuizContent ? (
                <>
                  <h3 className="text-lg font-bold">Provjeri znanje</h3>
                  <p className="text-sm text-muted-foreground">
                    Testiraj koliko si naučio/la iz ove lekcije
                  </p>
                  <button
                    onClick={() => setQuizOpen(true)}
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

      {hasQuizContent && (
        <div className="pt-4 border-t border-border/30">
          <button
            onClick={() => setQuizOpen(true)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7c5cfc] to-[#5b3fd9] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(124,92,252,0.3)] hover:shadow-[0_0_30px_rgba(124,92,252,0.5)]"
          >
            <Brain className="w-5 h-5" /> Provjeri znanje
          </button>
        </div>
      )}
    </>
  )
}
