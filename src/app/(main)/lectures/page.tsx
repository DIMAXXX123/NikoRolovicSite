'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, ChevronRight } from 'lucide-react'
import type { Lecture, Profile } from '@/lib/types'

export default function LecturesPage() {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selectedClass, setSelectedClass] = useState<number>(1)
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
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
      if (profileData) {
        setProfile(profileData)
        setSelectedClass(profileData.class_number)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    loadLectures()
  }, [selectedClass])

  async function loadLectures() {
    const { data } = await supabase
      .from('lectures')
      .select('*')
      .eq('class_number', selectedClass)
      .order('created_at', { ascending: false })

    if (data) setLectures(data)
  }

  // Group by subject
  const groupedBySubject = lectures.reduce((acc, lecture) => {
    if (!acc[lecture.subject]) acc[lecture.subject] = []
    acc[lecture.subject].push(lecture)
    return acc
  }, {} as Record<string, Lecture[]>)

  if (selectedLecture) {
    return (
      <div className="space-y-4 animate-fade-in">
        <button
          onClick={() => setSelectedLecture(null)}
          className="text-sm text-primary flex items-center gap-1"
        >
          ← Nazad
        </button>
        <div className="space-y-2">
          <span className="text-xs text-primary font-medium uppercase tracking-wider">
            {selectedLecture.subject}
          </span>
          <h1 className="text-2xl font-bold">{selectedLecture.title}</h1>
          <p className="text-xs text-muted-foreground">
            {selectedLecture.class_number}. razred · {new Date(selectedLecture.created_at).toLocaleDateString('sr-Latn')}
          </p>
        </div>
        <div className="prose prose-invert prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed text-sm">
            {selectedLecture.content}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold gradient-text">Lekcije</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold gradient-text">Lekcije</h1>
      
      {/* Class selector */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => setSelectedClass(n)}
            className={`flex-1 py-2 text-sm rounded-xl transition-all ${
              selectedClass === n
                ? 'bg-gradient-to-r from-purple-600 to-violet-700 text-white font-medium'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {n}. razred
          </button>
        ))}
      </div>

      {profile && selectedClass === profile.class_number && (
        <p className="text-xs text-primary">✨ Tvoj razred</p>
      )}

      {Object.keys(groupedBySubject).length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nema lekcija za ovaj razred</p>
        </div>
      ) : (
        Object.entries(groupedBySubject).map(([subject, subjectLectures]) => (
          <div key={subject} className="space-y-2">
            <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">{subject}</h2>
            {subjectLectures.map((lecture) => (
              <Card
                key={lecture.id}
                className="border-border/30 bg-card/50 backdrop-blur cursor-pointer hover:bg-card/80 transition-all active:scale-[0.98]"
                onClick={() => setSelectedLecture(lecture)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">{lecture.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(lecture.created_at).toLocaleDateString('sr-Latn')}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
