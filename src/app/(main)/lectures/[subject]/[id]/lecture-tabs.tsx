'use client'

import { useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

type Section = 'content' | 'video' | 'quiz'

export function LectureTabs({
  title,
  videoUrl,
  videoId,
  questions,
  flashcards,
  content,
}: LectureTabsProps) {
  const [activeSection, setActiveSection] = useState<Section>('content')
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

  return (
    <>
      <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as Section)}>
        <TabsList>
          <TabsTrigger value="content">📖 Lekcija</TabsTrigger>
          {hasVideo && <TabsTrigger value="video">🎬 Video</TabsTrigger>}
          <TabsTrigger value="quiz">🧠 Kviz</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Kept mounted so the server-rendered body is never thrown away. */}
      <div className="animate-fade-in" hidden={activeSection !== 'content'}>
        {content}
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
              {hasQuizContent ? (
                <>
                  <h3 className="text-[20px] font-extrabold leading-[1.25] text-heading">Provjeri znanje</h3>
                  <p className="text-[13px] font-bold text-muted-foreground">
                    Testiraj koliko si naučio/la iz ove lekcije
                  </p>
                  <Button onClick={() => setQuizOpen(true)} className="w-full">
                    Započni kviz →
                  </Button>
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

      {hasQuizContent && (
        <div className="pt-4 border-t-2 border-border">
          <Button onClick={() => setQuizOpen(true)} className="w-full">
            <Brain strokeWidth={2.4} /> Provjeri znanje
          </Button>
        </div>
      )}
    </>
  )
}
