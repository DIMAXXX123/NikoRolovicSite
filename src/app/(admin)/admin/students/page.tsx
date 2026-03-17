'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, X, Users } from 'lucide-react'

interface VerifiedStudent {
  id: string
  first_name: string
  last_name: string
  class_number: number
  section_number: number
  email: string
  used: boolean
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<VerifiedStudent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [classNumber, setClassNumber] = useState('1')
  const [sectionNumber, setSectionNumber] = useState('1')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadStudents() }, [])

  async function loadStudents() {
    const { data } = await supabase
      .from('verified_students')
      .select('*')
      .order('class_number', { ascending: true })
      .order('section_number', { ascending: true })
      .order('last_name', { ascending: true })
    if (data) setStudents(data)
  }

  async function addStudent(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await supabase.from('verified_students').insert({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      class_number: parseInt(classNumber),
      section_number: parseInt(sectionNumber),
      email: email.trim().toLowerCase(),
    })

    setFirstName(''); setLastName(''); setEmail('')
    setClassNumber('1'); setSectionNumber('1')
    setShowForm(false); setLoading(false)
    loadStudents()
  }

  async function deleteStudent(id: string) {
    if (!confirm('Obriši ovog učenika iz baze?')) return
    await supabase.from('verified_students').delete().eq('id', id)
    loadStudents()
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold gradient-text">Učenici</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-purple-600 to-violet-700 rounded-xl">
          {showForm ? <X className="w-4 h-4" /> : <><Plus className="w-4 h-4 mr-1" />Dodaj</>}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{students.length} učenika u bazi</p>

      {showForm && (
        <Card className="border-primary/30 bg-card/50 animate-slide-up">
          <CardContent className="p-4">
            <form onSubmit={addStudent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Ime</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label>Prezime</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required className="bg-background/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Razred</Label>
                  <select value={classNumber} onChange={(e) => setClassNumber(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm">
                    {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}. razred</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Odjeljenje</Label>
                  <select value={sectionNumber} onChange={(e) => setSectionNumber(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm">
                    {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}. odjeljenje</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background/50" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-violet-700">
                {loading ? 'Dodaje se...' : 'Dodaj učenika'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {students.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nema učenika u bazi</p>
        </div>
      ) : (
        students.map((student) => (
          <Card key={student.id} className="border-border/30 bg-card/50">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{student.first_name} {student.last_name}</p>
                <p className="text-xs text-muted-foreground">
                  {student.class_number}-{student.section_number} · {student.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={student.used ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}>
                  {student.used ? 'Registrovan' : 'Čeka'}
                </Badge>
                <button onClick={() => deleteStudent(student.id)} className="text-destructive p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
