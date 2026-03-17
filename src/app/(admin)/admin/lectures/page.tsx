'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, X } from 'lucide-react'
import type { Lecture } from '@/lib/types'

export default function AdminLecturesPage() {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [classNumber, setClassNumber] = useState('1')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadLectures() }, [])

  async function loadLectures() {
    const { data } = await supabase.from('lectures').select('*').order('created_at', { ascending: false })
    if (data) setLectures(data)
  }

  async function createLecture(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('lectures').insert({
      title, subject, content,
      class_number: parseInt(classNumber),
      author_id: user.id,
    })

    setTitle(''); setSubject(''); setContent(''); setClassNumber('1')
    setShowForm(false); setLoading(false); loadLectures()
  }

  async function deleteLecture(id: string) {
    if (!confirm('Obriši ovu lekciju?')) return
    await supabase.from('lectures').delete().eq('id', id)
    loadLectures()
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold gradient-text">Lekcije</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-purple-600 to-violet-700 rounded-xl">
          {showForm ? <X className="w-4 h-4" /> : <><Plus className="w-4 h-4 mr-1" />Nova</>}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30 bg-card/50 animate-slide-up">
          <CardContent className="p-4">
            <form onSubmit={createLecture} className="space-y-3">
              <div className="space-y-2">
                <Label>Naslov</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="bg-background/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Predmet</Label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} required className="bg-background/50" placeholder="npr. Matematika" />
                </div>
                <div className="space-y-2">
                  <Label>Razred</Label>
                  <select
                    value={classNumber}
                    onChange={(e) => setClassNumber(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>{n}. razred</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sadržaj lekcije</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={8} className="bg-background/50" placeholder="Tekst lekcije..." />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-violet-700">
                {loading ? 'Objavljuje se...' : 'Objavi lekciju'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {lectures.map((lecture) => (
        <Card key={lecture.id} className="border-border/30 bg-card/50">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <h3 className="font-medium">{lecture.title}</h3>
              <p className="text-xs text-muted-foreground">{lecture.subject} · {lecture.class_number}. razred</p>
            </div>
            <button onClick={() => deleteLecture(lecture.id)} className="text-destructive p-2">
              <Trash2 className="w-4 h-4" />
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
