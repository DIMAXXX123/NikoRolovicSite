'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Plus, X, Calculator } from 'lucide-react'

const DEFAULT_SUBJECTS = [
  'Fizika', 'Matematika', 'CSBH', 'Hemija', 'Engleski',
  'Italjanski', 'Fizicko', 'Likovno', 'Biologija', 'Istorija', 'Geografija',
]

interface SubjectGrade {
  name: string
  grade: number | null
}

const gradeColor: Record<number, string> = {
  5: 'text-green-400 border-green-500/50 bg-green-500/10',
  4: 'text-blue-400 border-blue-500/50 bg-blue-500/10',
  3: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10',
  2: 'text-orange-400 border-orange-500/50 bg-orange-500/10',
  1: 'text-red-400 border-red-500/50 bg-red-500/10',
}

const averageColor = (avg: number): string => {
  if (avg >= 4.5) return 'text-green-400'
  if (avg >= 3.5) return 'text-blue-400'
  if (avg >= 2.5) return 'text-yellow-400'
  if (avg >= 1.5) return 'text-orange-400'
  return 'text-red-400'
}

export function GpaCalculator({ onBack }: { onBack: () => void }) {
  const [subjects, setSubjects] = useState<SubjectGrade[]>([])
  const [newSubject, setNewSubject] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('gpa_grades')
    if (saved) {
      setSubjects(JSON.parse(saved))
    } else {
      setSubjects(DEFAULT_SUBJECTS.map(name => ({ name, grade: null })))
    }
  }, [])

  function save(updated: SubjectGrade[]) {
    setSubjects(updated)
    localStorage.setItem('gpa_grades', JSON.stringify(updated))
  }

  function setGrade(index: number, grade: number) {
    const updated = [...subjects]
    updated[index] = { ...updated[index], grade: updated[index].grade === grade ? null : grade }
    save(updated)
  }

  function addSubject() {
    const name = newSubject.trim()
    if (!name || subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) return
    save([...subjects, { name, grade: null }])
    setNewSubject('')
    setShowAdd(false)
  }

  function removeSubject(index: number) {
    save(subjects.filter((_, i) => i !== index))
  }

  const graded = subjects.filter(s => s.grade !== null)
  const average = graded.length > 0
    ? graded.reduce((sum, s) => sum + (s.grade || 0), 0) / graded.length
    : 0

  return (
    <div className="space-y-4 animate-fade-in">
      <button onClick={onBack} className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all">
        <ChevronLeft className="w-4 h-4" /> Nazad na profil
      </button>

      <h1 className="text-2xl font-bold gradient-text">Kalkulator proseka</h1>

      {/* Average display */}
      <Card className="border-border/30 bg-card/50 backdrop-blur overflow-hidden">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Tvoj prosek</p>
          <div className={`text-5xl font-bold transition-all duration-500 ${average > 0 ? averageColor(average) : 'text-muted-foreground'}`}>
            {average > 0 ? average.toFixed(2) : '—'}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {graded.length} od {subjects.length} predmeta ocijenjeno
          </p>
        </CardContent>
      </Card>

      {/* Subjects list */}
      <div className="space-y-2">
        {subjects.map((subject, i) => (
          <Card key={subject.name} className="border-border/30 bg-card/50 backdrop-blur">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium truncate flex-1">{subject.name}</span>
                {!DEFAULT_SUBJECTS.includes(subject.name) && (
                  <button
                    onClick={() => removeSubject(i)}
                    className="text-muted-foreground hover:text-destructive ml-2 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrade(i, g)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-all active:scale-95 ${
                      subject.grade === g
                        ? gradeColor[g]
                        : 'border-border/30 text-muted-foreground hover:border-border/60'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add custom subject */}
      {showAdd ? (
        <Card className="border-border/30 bg-card/50 backdrop-blur animate-fade-in">
          <CardContent className="p-3 flex gap-2">
            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
              placeholder="Naziv predmeta..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <Button size="sm" onClick={addSubject} disabled={!newSubject.trim()}>
              Dodaj
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setNewSubject('') }}>
              <X className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3 rounded-2xl border border-dashed border-border/50 text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-primary/50 hover:text-primary transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Dodaj predmet
        </button>
      )}
    </div>
  )
}
