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

  const selectClass = "flex h-11 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Učenici</h1>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl"
        >
          {showForm ? <X className="w-4 h-4" /> : <><Plus className="w-4 h-4 mr-1" />Dodaj</>}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Pretraži po imenu, prezimenu ili emailu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-xl bg-slate-800 border-slate-600 text-white focus:border-blue-500 placeholder:text-slate-500"
        />
      </div>

      <p className="text-sm text-slate-400">{filteredStudents.length} od {students.length} učenika</p>

      {showForm && (
        <div className="rounded-xl bg-[#1e293b] border border-blue-500/30 p-4 animate-slide-up">
          <form onSubmit={addStudent} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-200">Ime</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="rounded-xl bg-slate-800 border-slate-600 text-white focus:border-blue-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Prezime</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required className="rounded-xl bg-slate-800 border-slate-600 text-white focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-200">Razred</Label>
                <select value={classNumber} onChange={(e) => setClassNumber(e.target.value)} className={selectClass}>
                  {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}. razred</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Odjeljenje</Label>
                <select value={sectionNumber} onChange={(e) => setSectionNumber(e.target.value)} className={selectClass}>
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}. odjeljenje</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl bg-slate-800 border-slate-600 text-white focus:border-blue-500" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl">
              {loading ? 'Dodaje se...' : 'Dodaj učenika'}
            </Button>
          </form>
        </div>
      )}

      {filteredStudents.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{searchQuery ? 'Nema rezultata' : 'Nema učenika u bazi'}</p>
        </div>
      ) : (
        filteredStudents.map((student) => (
          <div key={student.id} className="rounded-xl bg-[#1e293b] border border-slate-700/50 p-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-white">{student.first_name} {student.last_name}</p>
              <p className="text-xs text-slate-400">
                {student.class_number}-{student.section_number} · {student.email}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${student.used ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                {student.used ? 'Registrovan' : 'Čeka'}
              </span>
              <button onClick={() => deleteStudent(student.id, student)} className="text-red-400 p-1 hover:text-red-300">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
