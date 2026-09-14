'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, X, Users, Search } from 'lucide-react'

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
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  async function loadStudents() {
    const { data } = await supabase
      .from('verified_students')
      .select('*')
      .order('class_number', { ascending: true })
      .order('section_number', { ascending: true })
      .order('last_name', { ascending: true })
    if (data) setStudents(data)
  }

  useEffect(() => {
    async function init() { await loadStudents() }
    init()
  }, [])

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

  async function deleteStudent(id: string, student: VerifiedStudent) {
    if (!confirm('Obriši ovog učenika iz baze?')) return

    // Kick from ALL tables: verified_students + profiles + auth
    await fetch('/api/kick-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: student.first_name,
        lastName: student.last_name,
        classNumber: student.class_number,
        sectionNumber: student.section_number,
      }),
    })

    // Also delete from verified_students via client (in case API didn't catch it)
    await supabase.from('verified_students').delete().eq('id', id)
    loadStudents()
  }

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students
    const q = searchQuery.toLowerCase()
    return students.filter((s) =>
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    )
  }, [students, searchQuery])

  const selectClass = "flex h-[50px] w-full rounded-2xl border-2 border-border bg-muted px-4 text-[15px] font-bold text-foreground focus:border-secondary focus:bg-background focus:outline-none transition-colors"

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] leading-[1.2] tracking-[-0.01em] font-extrabold text-heading">Učenici</h1>
        <Button
          size="sm"
          variant={showForm ? 'outline' : 'default'}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X strokeWidth={2.6} /> : <><Plus strokeWidth={2.6} />Dodaj</>}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-disabled" strokeWidth={2.4} />
        <Input
          placeholder="Pretraži po imenu, prezimenu ili emailu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12"
        />
      </div>

      <p className="text-[13px] font-bold text-muted-foreground">{filteredStudents.length} od {students.length} učenika</p>

      {showForm && (
        <div className="rounded-2xl bg-card border-2 border-border shadow-[0_2px_0_var(--color-border)] p-4 animate-slide-up">
          <form onSubmit={addStudent} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ime</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div>
                <Label>Prezime</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Razred</Label>
                <select value={classNumber} onChange={(e) => setClassNumber(e.target.value)} className={selectClass}>
                  {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}. razred</option>)}
                </select>
              </div>
              <div>
                <Label>Odjeljenje</Label>
                <select value={sectionNumber} onChange={(e) => setSectionNumber(e.target.value)} className={selectClass}>
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}. odjeljenje</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Dodaje se...' : 'Dodaj učenika'}
            </Button>
          </form>
        </div>
      )}

      {filteredStudents.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-8 h-8 text-disabled" strokeWidth={2.4} />
          </div>
          <p className="text-[17px] font-extrabold text-foreground">{searchQuery ? 'Nema rezultata' : 'Nema učenika u bazi'}</p>
        </div>
      ) : (
        filteredStudents.map((student, index) => (
          <div
            key={student.id}
            className="animate-stagger-item rounded-2xl bg-card border-2 border-border shadow-[0_2px_0_var(--color-border)] p-3 min-h-[64px] flex items-center justify-between gap-3"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div className="min-w-0">
              <p className="text-[15px] font-extrabold text-heading truncate">{student.first_name} {student.last_name}</p>
              <p className="text-[13px] font-bold text-muted-foreground truncate">
                {student.class_number}-{student.section_number}{student.email && !student.email.includes('@pending.local') && !student.email.includes('@temp.com') ? ` · ${student.email}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`inline-flex items-center h-6 text-[11px] leading-none font-extrabold uppercase tracking-[0.06em] px-2.5 rounded-full border-2 ${student.used ? 'bg-primary-light text-primary-text border-primary-light-border' : 'bg-background text-muted-foreground border-border'}`}>
                {student.used ? 'Registrovan' : 'Čeka'}
              </span>
              <button onClick={() => deleteStudent(student.id, student)} className="w-11 h-11 rounded-xl flex items-center justify-center text-destructive hover:bg-[#FFDFE0] transition-colors">
                <Trash2 className="w-5 h-5" strokeWidth={2.4} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
