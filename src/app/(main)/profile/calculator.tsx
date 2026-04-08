'use client'

import { useState, useEffect } from 'react'
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

const GRADE_COLORS: Record<number, string> = {
  1: '#F44336',
  2: '#FF9800',
  3: '#FFC107',
  4: '#2196F3',
  5: '#4CAF50',
}

const GRADE_BG: Record<number, string> = {
  1: 'bg-[#F44336]/15 border-[#F44336]/40 text-[#F44336]',
  2: 'bg-[#FF9800]/15 border-[#FF9800]/40 text-[#FF9800]',
  3: 'bg-[#FFC107]/15 border-[#FFC107]/40 text-[#FFC107]',
  4: 'bg-[#2196F3]/15 border-[#2196F3]/40 text-[#2196F3]',
  5: 'bg-[#4CAF50]/15 border-[#4CAF50]/40 text-[#4CAF50]',
}

const GRADE_IDLE = 'border-[#1a1a2e] text-muted-foreground hover:border-[#2a2a3e]'

function getAvgColor(avg: number): string {
  if (avg >= 4.5) return '#4CAF50'
  if (avg >= 3.5) return '#2196F3'
  if (avg >= 2.5) return '#FFC107'
  if (avg >= 1.5) return '#FF9800'
  return '#F44336'
}

function getAvgLabel(avg: number): string {
  if (avg >= 4.5) return 'Odličan'
  if (avg >= 3.5) return 'Vrlo dobar'
  if (avg >= 2.5) return 'Dobar'
  if (avg >= 1.5) return 'Dovoljan'
  return 'Nedovoljan'
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

  const circumference = 2 * Math.PI * 44
  const progress = average > 0 ? (average / 5) * circumference : 0
  const dashOffset = circumference - progress
  const ringColor = average > 0 ? getAvgColor(average) : '#333'

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={onBack} className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all">
        <ChevronLeft className="w-4 h-4" /> Nazad na profil
      </button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <Calculator className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold gradient-text">Kalkulator proseka</h1>
          <p className="text-sm text-muted-foreground">Izračunaj svoj prosjek ocjena</p>
        </div>
      </div>

      {/* Circular Average Display */}
      <div className="rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] p-8 flex flex-col items-center">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke="#1a1a2e"
              strokeWidth="8"
            />
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-3xl font-bold transition-all duration-500"
              style={{ color: average > 0 ? ringColor : '#666' }}
            >
              {average > 0 ? average.toFixed(2) : '—'}
            </span>
          </div>
        </div>
        {average > 0 && (
          <p
            className="mt-3 text-sm font-medium transition-all duration-300"
            style={{ color: ringColor }}
          >
            {getAvgLabel(average)}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          {graded.length}/{subjects.length} predmeta
        </p>
      </div>

      {/* Subjects list */}
      <div className="space-y-2">
        {subjects.map((subject, i) => (
          <div
            key={subject.name}
            className="rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] p-4 flex items-center justify-between gap-3 transition-all"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{subject.name}</span>
              {!DEFAULT_SUBJECTS.includes(subject.name) && (
                <button
                  onClick={() => removeSubject(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              {[1, 2, 3, 4, 5].map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(i, g)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold border transition-all duration-200 active:scale-90 ${
                    subject.grade === g
                      ? GRADE_BG[g]
                      : GRADE_IDLE
                  }`}
                  style={
                    subject.grade === g
                      ? { boxShadow: `0 0 12px ${GRADE_COLORS[g]}30` }
                      : undefined
                  }
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add custom subject */}
      {showAdd ? (
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] p-4 flex gap-2 animate-fade-in">
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
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3 rounded-2xl border border-dashed border-[#1a1a2e] text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-primary/50 hover:text-primary transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Dodaj predmet
        </button>
      )}
    </div>
  )
}
