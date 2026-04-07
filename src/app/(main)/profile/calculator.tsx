'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Plus, X, BarChart3 } from 'lucide-react'

const DEFAULT_SUBJECTS = [
  'Fizika', 'Matematika', 'CSBH', 'Hemija', 'Engleski',
  'Italjanski', 'Fizicko', 'Likovno', 'Biologija', 'Istorija', 'Geografija',
]

interface SubjectGrade {
  name: string
  grade: number | null
}

const gradeColors: Record<number, { text: string; border: string; bg: string; glow: string; solid: string }> = {
  5: { text: 'text-green-400', border: 'border-green-500/60', bg: 'bg-green-500/15', glow: 'shadow-[0_0_16px_rgba(74,222,128,0.4)]', solid: 'bg-green-500' },
  4: { text: 'text-blue-400', border: 'border-blue-500/60', bg: 'bg-blue-500/15', glow: 'shadow-[0_0_16px_rgba(96,165,250,0.4)]', solid: 'bg-blue-500' },
  3: { text: 'text-yellow-400', border: 'border-yellow-500/60', bg: 'bg-yellow-500/15', glow: 'shadow-[0_0_16px_rgba(250,204,21,0.4)]', solid: 'bg-yellow-500' },
  2: { text: 'text-orange-400', border: 'border-orange-500/60', bg: 'bg-orange-500/15', glow: 'shadow-[0_0_16px_rgba(251,146,60,0.4)]', solid: 'bg-orange-500' },
  1: { text: 'text-red-400', border: 'border-red-500/60', bg: 'bg-red-500/15', glow: 'shadow-[0_0_16px_rgba(248,113,113,0.4)]', solid: 'bg-red-500' },
}

function avgGradient(avg: number): string {
  if (avg >= 4.5) return 'from-[#4CAF50] to-emerald-600'
  if (avg >= 3.5) return 'from-[#2196F3] to-blue-600'
  if (avg >= 2.5) return 'from-[#FFC107] to-amber-600'
  if (avg >= 1.5) return 'from-[#FF9800] to-orange-600'
  return 'from-[#F44336] to-red-600'
}

function avgLabel(avg: number): string {
  if (avg >= 4.5) return 'Odlican'
  if (avg >= 3.5) return 'Vrlo dobar'
  if (avg >= 2.5) return 'Dobar'
  if (avg >= 1.5) return 'Dovoljan'
  return 'Nedovoljan'
}

const distBarColors: Record<number, string> = {
  5: 'bg-green-500',
  4: 'bg-blue-500',
  3: 'bg-yellow-500',
  2: 'bg-orange-500',
  1: 'bg-red-500',
}

export function GpaCalculator({ onBack }: { onBack: () => void }) {
  const [subjects, setSubjects] = useState<SubjectGrade[]>([])
  const [newSubject, setNewSubject] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [animatingGrade, setAnimatingGrade] = useState<string | null>(null)

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
    const key = `${index}-${grade}`
    setAnimatingGrade(key)
    setTimeout(() => setAnimatingGrade(null), 300)

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

  const distribution = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    graded.forEach(s => { if (s.grade) counts[s.grade]++ })
    return counts
  }, [graded])

  const circumference = 2 * Math.PI * 44
  const progressPercent = average > 0 ? (average / 5) : 0
  const offset = circumference * (1 - progressPercent)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back button */}
      <button
        onClick={onBack}
        className="group flex items-center gap-2 px-3 py-2 -ml-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-all duration-200"
      >
        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        Nazad na profil
      </button>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold gradient-text">Kalkulator proseka</h1>
        <p className="text-sm text-muted-foreground mt-1">Unesi ocjene i izracunaj prosjek</p>
      </div>

      {/* Average display - gradient card with circular progress */}
      <div className={`relative overflow-hidden rounded-3xl ${average > 0 ? `bg-gradient-to-br ${avgGradient(average)}` : 'bg-gradient-to-br from-[#7c5cfc]/80 to-[#7c5cfc]/40'} p-6 shadow-xl`}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-white/70 text-sm font-medium">Tvoj prosjek</p>
            <p className="text-white text-lg font-bold">
              {average > 0 ? avgLabel(average) : 'Nema ocjena'}
            </p>
            <p className="text-white/50 text-xs font-medium">
              {graded.length} od {subjects.length} predmeta ocijenjeno
            </p>
          </div>

          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="white"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="animate-circular-progress"
                style={{
                  filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.3))',
                  ['--circumference' as string]: circumference,
                  ['--offset' as string]: offset,
                  transition: 'stroke-dashoffset 0.8s ease-out',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white drop-shadow-lg">
                {average > 0 ? average.toFixed(2) : '---'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grade distribution bar */}
      {graded.length > 0 && (
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0c0c14]/80 backdrop-blur p-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <BarChart3 className="w-4 h-4" />
            Raspodjela ocjena
          </div>

          {/* Stacked bar */}
          <div className="flex h-3 rounded-full overflow-hidden bg-white/5">
            {([5, 4, 3, 2, 1] as const).map(g => {
              const count = distribution[g]
              if (count === 0) return null
              const pct = (count / graded.length) * 100
              return (
                <div
                  key={g}
                  className={`${distBarColors[g]} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-between text-xs">
            {([5, 4, 3, 2, 1] as const).map(g => (
              <div key={g} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${distBarColors[g]}`} />
                <span className="text-muted-foreground">
                  {g}: <span className="text-white/80 font-medium">{distribution[g]}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subjects list */}
      <div className="space-y-2.5">
        {subjects.map((subject, i) => (
          <div
            key={subject.name}
            className="rounded-2xl border border-[#1a1a2e] bg-[#0c0c14]/80 backdrop-blur p-4 transition-all duration-200 hover:border-[#1a1a2e]/80"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-semibold text-white/90 truncate flex-1">{subject.name}</span>
              {subject.grade !== null && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${gradeColors[subject.grade].bg} ${gradeColors[subject.grade].text} mr-2`}>
                  Ocjena: {subject.grade}
                </span>
              )}
              {!DEFAULT_SUBJECTS.includes(subject.name) && (
                <button
                  onClick={() => removeSubject(i)}
                  className="text-muted-foreground hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((g) => {
                const isSelected = subject.grade === g
                const isAnimating = animatingGrade === `${i}-${g}`
                const colors = gradeColors[g]
                return (
                  <button
                    key={g}
                    onClick={() => setGrade(i, g)}
                    className={`
                      flex-1 py-2.5 rounded-xl text-base font-bold border-2 transition-all duration-200
                      ${isAnimating ? 'scale-90' : 'active:scale-90'}
                      ${isSelected
                        ? `${colors.text} ${colors.border} ${colors.bg} ${colors.glow}`
                        : 'border-[#1a1a2e] text-muted-foreground hover:border-white/20 hover:text-white/70 hover:bg-white/5'
                      }
                    `}
                    style={{
                      transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    {g}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add custom subject */}
      {showAdd ? (
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0c0c14]/80 backdrop-blur p-4 animate-fade-in">
          <div className="flex gap-2">
            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
              placeholder="Naziv predmeta..."
              className="flex-1 bg-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none border border-[#1a1a2e] focus:border-[#7c5cfc]/50 transition-colors placeholder:text-muted-foreground"
              autoFocus
            />
            <Button size="sm" onClick={addSubject} disabled={!newSubject.trim()} className="px-4 rounded-xl">
              Dodaj
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setNewSubject('') }} className="rounded-xl">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-[#1a1a2e] text-sm font-medium text-muted-foreground flex items-center justify-center gap-2 hover:border-[#7c5cfc]/50 hover:text-[#7c5cfc] transition-all duration-200 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Dodaj predmet
        </button>
      )}
    </div>
  )
}
