'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

const SUBJECTS = [
  'Matematika', 'Fizika', 'Hemija', 'Biologija', 'CSBH',
  'Engleski', 'Istorija', 'Geografija', 'Likovno', 'Fizicko',
  'Italjanski', 'Muzicko',
]

const GRADE_TYPES = ['Test', 'Ispit usmeni', 'Pismeni', 'Zaključna ocjena'] as const
type GradeType = typeof GRADE_TYPES[number]

const TRIMESTER_LABELS = ['I tromjesečje', 'II tromjesečje', 'III tromjesečje', 'IV tromjesečje']

interface GradeData {
  [trimester: number]: {
    [subject: string]: {
      [gradeType: string]: number | null
    }
  }
}

const GRADE_COLORS: Record<number, string> = {
  5: 'bg-green-500 text-white',
  4: 'bg-blue-500 text-white',
  3: 'bg-yellow-500 text-white',
  2: 'bg-orange-500 text-white',
  1: 'bg-red-500 text-white',
}

const GRADE_RING: Record<number, string> = {
  5: 'ring-green-500/30',
  4: 'ring-blue-500/30',
  3: 'ring-yellow-500/30',
  2: 'ring-orange-500/30',
  1: 'ring-red-500/30',
}

function getStorageKey() {
  return 'my_grades_data'
}

function loadGrades(): GradeData {
  if (typeof window === 'undefined') return {}
  try {
    const saved = localStorage.getItem(getStorageKey())
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return {}
}

function saveGrades(data: GradeData) {
  localStorage.setItem(getStorageKey(), JSON.stringify(data))
}

function calcSubjectAvg(grades: { [gradeType: string]: number | null }): number | null {
  const vals = Object.values(grades).filter((v): v is number => v !== null && v > 0)
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function calcOverallAvg(trimesterData: { [subject: string]: { [gradeType: string]: number | null } }): number | null {
  const avgs: number[] = []
  for (const subject of SUBJECTS) {
    const grades = trimesterData[subject]
    if (!grades) continue
    const avg = calcSubjectAvg(grades)
    if (avg !== null) avgs.push(avg)
  }
  if (avgs.length === 0) return null
  return avgs.reduce((a, b) => a + b, 0) / avgs.length
}

export default function GradesPage() {
  const [activeTrimester, setActiveTrimester] = useState(0)
  const [grades, setGrades] = useState<GradeData>({})
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setGrades(loadGrades())
  }, [])

  function setGrade(trimester: number, subject: string, gradeType: string, value: number | null) {
    const updated = { ...grades }
    if (!updated[trimester]) updated[trimester] = {}
    if (!updated[trimester][subject]) updated[trimester][subject] = {}
    updated[trimester][subject][gradeType] = value
    setGrades(updated)
    saveGrades(updated)
    setEditingCell(null)
  }

  function getGrade(trimester: number, subject: string, gradeType: string): number | null {
    return grades[trimester]?.[subject]?.[gradeType] ?? null
  }

  const trimesterData = grades[activeTrimester] || {}
  const overallAvg = calcOverallAvg(trimesterData)

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-bold gradient-text">Moje ocjene</h1>
      </div>

      {/* Trimester tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {TRIMESTER_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => setActiveTrimester(i)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTrimester === i
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overall average */}
      {overallAvg !== null && (
        <Card className="border-border/30 bg-gradient-to-r from-purple-500/10 to-violet-500/10 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm font-medium">Ukupan prosjek</span>
            <span className={`text-2xl font-bold ${
              overallAvg >= 4.5 ? 'text-green-400' :
              overallAvg >= 3.5 ? 'text-blue-400' :
              overallAvg >= 2.5 ? 'text-yellow-400' :
              overallAvg >= 1.5 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {overallAvg.toFixed(2)}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Subjects */}
      <div className="space-y-3">
        {SUBJECTS.map((subject) => {
          const subjectGrades = trimesterData[subject] || {}
          const avg = calcSubjectAvg(subjectGrades)

          return (
            <Card key={subject} className="border-border/30 bg-card/50 backdrop-blur">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">{subject}</h3>
                  {avg !== null && (
                    <span className={`text-sm font-bold ${
                      avg >= 4.5 ? 'text-green-400' :
                      avg >= 3.5 ? 'text-blue-400' :
                      avg >= 2.5 ? 'text-yellow-400' :
                      avg >= 1.5 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {avg.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {GRADE_TYPES.map((gradeType) => {
                    const grade = getGrade(activeTrimester, subject, gradeType)
                    const cellKey = `${activeTrimester}-${subject}-${gradeType}`
                    const isEditing = editingCell === cellKey

                    return (
                      <div key={gradeType} className="text-center">
                        <p className="text-[10px] text-muted-foreground mb-1 truncate">{gradeType}</p>
                        {isEditing ? (
                          <div className="flex flex-col items-center gap-0.5">
                            {[5, 4, 3, 2, 1].map((v) => (
                              <button
                                key={v}
                                onClick={() => setGrade(activeTrimester, subject, gradeType, v)}
                                className={`w-8 h-6 rounded text-xs font-bold ${GRADE_COLORS[v]} transition-all active:scale-90`}
                              >
                                {v}
                              </button>
                            ))}
                            <button
                              onClick={() => { setGrade(activeTrimester, subject, gradeType, null); setEditingCell(null) }}
                              className="w-8 h-6 rounded text-[10px] bg-muted text-muted-foreground"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingCell(cellKey)}
                            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all active:scale-90 ${
                              grade
                                ? `${GRADE_COLORS[grade]} ring-2 ${GRADE_RING[grade]}`
                                : 'bg-muted/50 text-muted-foreground border border-dashed border-border/50'
                            }`}
                          >
                            {grade || '—'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
