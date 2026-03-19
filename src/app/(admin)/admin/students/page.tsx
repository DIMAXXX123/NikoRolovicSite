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

  const selectClass = "flex h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-colors"

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Učenici</h1>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all"
        >
          {showForm ? <X className="w-4 h-4" /> : <><Plus className="w-4 h-4 mr-1" />Dodaj</>}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <Input
          placeholder="Pretraži po imenu, prezimenu ili emailu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-xl bg-white/[0.04] border-white/[0.08] text-white focus:border-purple-500 focus:ring-purple-500/20 placeholder:text-white/30"
        />
      </div>

      <p className="text-sm text-white/40">{filteredStudents.length} od {students.length} učenika</p>

      {showForm && (
        <div className="rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-purple-500/20 p-5 animate-slide-up">
          <form onSubmit={addStudent} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">Ime</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="rounded-xl bg-white/[0.04] border-white/[0.08] text-white focus:border-purple-500 focus:ring-purple-500/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">Prezime</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required className="rounded-xl bg-white/[0.04] border-white/[0.08] text-white focus:border-purple-500 focus:ring-purple-500/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">Razred</Label>
                <select value={classNumber} onChange={(e) => setClassNumber(e.target.value)} className={selectClass}>
                  {[1, 2, 3, 4].map((n) => <option key={n} value={n} className="bg-[#1a1f35] text-white">{n}. razred</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">Odjeljenje</Label>
                <select value={sectionNumber} onChange={(e) => setSectionNumber(e.target.value)} className={selectClass}>
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n} className="bg-[#1a1f35] text-white">{n}. odjeljenje</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl bg-white/[0.04] border-white/[0.08] text-white focus:border-purple-500 focus:ring-purple-500/20" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white rounded-xl shadow-lg shadow-purple-500/20">
              {loading ? 'Dodaje se...' : 'Dodaj učenika'}
            </Button>
          </form>
        </div>
      )}

      {filteredStudents.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{searchQuery ? 'Nema rezultata' : 'Nema učenika u bazi'}</p>
        </div>
      ) : (
        filteredStudents.map((student, index) => (
          <div
            key={student.id}
            className="animate-stagger-item rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] p-3 flex items-center justify-between hover:-translate-y-[2px] hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/20 transition-all duration-300 group"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div>
              <p className="font-medium text-sm text-white group-hover:text-purple-200 transition-colors">{student.first_name} {student.last_name}</p>
              <p className="text-xs text-white/30">
                {student.class_number}-{student.section_number}{student.email && !student.email.includes('@pending.local') && !student.email.includes('@temp.com') ? ` · ${student.email}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${student.used ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-white/[0.04] text-white/30 border border-white/[0.08]'}`}>
                {student.used ? 'Registrovan' : 'Čeka'}
              </span>
              <button onClick={() => deleteStudent(student.id, student)} className="text-red-400/60 p-1 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
