'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, badgeVariants } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { VariantProps } from 'class-variance-authority'
import { ChevronLeft, Plus, X, BarChart3 } from 'lucide-react'

const DEFAULT_SUBJECTS = [
  'Fizika', 'Matematika', 'CSBH', 'Hemija', 'Engleski',
  'Italjanski', 'Fizicko', 'Likovno', 'Biologija', 'Istorija', 'Geografija',
]

interface SubjectGrade {
  name: string
  grade: number | null
}

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

// Grade colours from the palette (§2): 5 green, 4 blue, 3 gold, 2 orange, 1 red.
// `selected` = solid coloured 3D button (§4.1), `badge` = matching §4.3 tint.
const gradeColors: Record<number, { selected: string; badge: BadgeVariant; badgeClass: string; solid: string; hex: string }> = {
  5: { selected: 'bg-primary text-primary-foreground shadow-[0_2px_0_var(--color-primary-dark)]', badge: 'default', badgeClass: '', solid: 'bg-primary', hex: '#58CC02' },
  4: { selected: 'bg-secondary text-[#FFFFFF] shadow-[0_2px_0_var(--color-secondary-dark)]', badge: 'secondary', badgeClass: '', solid: 'bg-secondary', hex: '#1CB0F6' },
  3: { selected: 'bg-gold text-[#4B4B4B] shadow-[0_2px_0_var(--color-gold-dark)]', badge: 'gold', badgeClass: '', solid: 'bg-gold', hex: '#FFC800' },
  2: { selected: 'bg-orange text-[#FFFFFF] shadow-[0_2px_0_#D97F00]', badge: 'outline', badgeClass: 'border-[#FFD1A3] bg-[#FFF0E0] text-orange', solid: 'bg-orange', hex: '#FF9600' },
  1: { selected: 'bg-destructive text-destructive-foreground shadow-[0_2px_0_var(--color-destructive-dark)]', badge: 'destructive', badgeClass: '', solid: 'bg-destructive', hex: '#FF4B4B' },
}

function avgColor(avg: number): string {
  if (avg >= 4.5) return '#58CC02'
  if (avg >= 3.5) return '#1CB0F6'
  if (avg >= 2.5) return '#FFC800'
  if (avg >= 1.5) return '#FF9600'
  return '#FF4B4B'
}

function avgLabel(avg: number): string {
  if (avg >= 4.5) return 'Odlican'
  if (avg >= 3.5) return 'Vrlo dobar'
  if (avg >= 2.5) return 'Dobar'
  if (avg >= 1.5) return 'Dovoljan'
  return 'Nedovoljan'
}

const distBarColors: Record<number, string> = {
  5: 'bg-primary',
  4: 'bg-secondary',
  3: 'bg-gold',
  2: 'bg-orange',
  1: 'bg-destructive',
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
  const ringColor = average > 0 ? avgColor(average) : '#58CC02'

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="group h-11 px-3 -ml-3 text-[13px]"
      >
        <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.6} />
        Nazad na profil
      </Button>

      {/* Title */}
      <div>
        <h1 className="text-[26px] leading-[1.2] font-extrabold tracking-[-0.01em] text-heading">Kalkulator proseka</h1>
        <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground mt-1">Unesi ocjene i izracunaj prosjek</p>
      </div>

      {/* Average display - card with circular progress */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <p className="text-[12px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Tvoj prosjek</p>
            <p className="text-[20px] leading-[1.25] font-extrabold text-heading">
              {average > 0 ? avgLabel(average) : 'Nema ocjena'}
            </p>
            <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground">
              {graded.length} od {subjects.length} predmeta ocijenjeno
            </p>
          </div>

          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#E5E5E5" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke={ringColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="animate-circular-progress"
                style={{
                  ['--circumference' as string]: circumference,
                  ['--offset' as string]: offset,
                  transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.3s ease-out',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[26px] leading-none font-black tabular-nums text-heading">
                {average > 0 ? average.toFixed(2) : '---'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Grade distribution bar */}
      {graded.length > 0 && (
        <Card className="gap-3 animate-fade-in">
          <div className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">
            <BarChart3 className="w-4 h-4" strokeWidth={2.4} />
            Raspodjela ocjena
          </div>

          {/* Stacked bar */}
          <div className="flex h-4 rounded-full overflow-hidden bg-border">
            {([5, 4, 3, 2, 1] as const).map(g => {
              const count = distribution[g]
              if (count === 0) return null
              const pct = (count / graded.length) * 100
              return (
                <div
                  key={g}
                  className={`${distBarColors[g]} transition-all duration-500 shadow-[inset_0_4px_0_rgba(255,255,255,0.3)]`}
                  style={{ width: `${pct}%` }}
                />
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-between text-[13px] font-bold">
            {([5, 4, 3, 2, 1] as const).map(g => (
              <div key={g} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${distBarColors[g]}`} />
                <span className="text-muted-foreground">
                  {g}: <span className="text-foreground font-extrabold tabular-nums">{distribution[g]}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Subjects list */}
      <div className="space-y-2.5">
        {subjects.map((subject, i) => (
          <Card
            key={subject.name}
            className="gap-3"
          >
            <div className="flex items-center justify-between gap-2 min-h-6">
              <span className="text-[17px] leading-[1.3] font-extrabold text-heading truncate flex-1">{subject.name}</span>
              {subject.grade !== null && (
                <Badge variant={gradeColors[subject.grade].badge} className={gradeColors[subject.grade].badgeClass}>
                  Ocjena: {subject.grade}
                </Badge>
              )}
              {!DEFAULT_SUBJECTS.includes(subject.name) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSubject(i)}
                  className="-my-2 -mr-2 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-5 h-5" strokeWidth={2.6} />
                </Button>
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
                      flex-1 h-11 rounded-xl text-[15px] font-extrabold border-2 tabular-nums select-none outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
                      ${isAnimating ? 'scale-90' : 'active:translate-y-[2px] active:shadow-none'}
                      ${isSelected
                        ? `border-transparent ${colors.selected}`
                        : 'border-border bg-background text-muted-foreground shadow-[0_2px_0_var(--color-border)] hover:bg-muted'
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
          </Card>
        ))}
      </div>

      {/* Add custom subject */}
      {showAdd ? (
        <Card className="animate-fade-in">
          <div className="flex gap-2">
            <Input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
              placeholder="Naziv predmeta..."
              className="flex-1"
              autoFocus
            />
            <Button onClick={addSubject} disabled={!newSubject.trim()} className="px-4">
              Dodaj
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { setShowAdd(false); setNewSubject('') }} className="h-[50px] w-[50px]">
              <X className="w-5 h-5" strokeWidth={2.6} />
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowAdd(true)}
          className="w-full"
        >
          <Plus className="w-5 h-5" strokeWidth={2.6} />
          Dodaj predmet
        </Button>
      )}
    </div>
  )
}
