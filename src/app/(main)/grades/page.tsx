'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, Plus, X, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const DEFAULT_SUBJECTS = [
  'Matematika', 'Fizika', 'Hemija', 'Biologija', 'Istorija',
  'Geografija', 'CSBH', 'Engleski', 'Fizicko', 'Likovno',
]

const OPTIONAL_SUBJECTS = [
  'Italjanski', 'Njemacki', 'Spanski', 'Izborni spanski',
]

const TRIMESTER_LABELS = ['I', 'II', 'III', 'IV']

interface SubjectGrades {
  test: number[]
  pismeni: number[]
  usmeni: number | null
  zakljucna: number | null
}

interface GradeData {
  [trimester: number]: {
    [subject: string]: SubjectGrades
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

const STORAGE_KEY = 'my_grades_data_v2'
const SUBJECTS_KEY = 'my_grades_subjects'

function loadGrades(): GradeData {
  if (typeof window === 'undefined') return {}
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return {}
}

function saveGrades(data: GradeData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function loadSubjects(): string[] {
  if (typeof window === 'undefined') return DEFAULT_SUBJECTS
  try {
    const saved = localStorage.getItem(SUBJECTS_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return DEFAULT_SUBJECTS
}

function saveSubjects(subjects: string[]) {
  localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects))
}

function emptySubjectGrades(): SubjectGrades {
  return { test: [], pismeni: [], usmeni: null, zakljucna: null }
}

function getSubjectData(grades: GradeData, trimester: number, subject: string): SubjectGrades {
  const d = grades[trimester]?.[subject]
  if (!d) return emptySubjectGrades()
  return {
    test: d.test || [],
    pismeni: d.pismeni || [],
    usmeni: d.usmeni ?? null,
    zakljucna: d.zakljucna ?? null,
  }
}

function calcOverallAvg(trimesterData: { [subject: string]: SubjectGrades } | undefined, subjects: string[]): number | null {
  if (!trimesterData) return null
  const vals: number[] = []
  for (const subject of subjects) {
    const sg = trimesterData[subject]
    if (sg?.zakljucna && sg.zakljucna > 0) vals.push(sg.zakljucna)
  }
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function avgColor(avg: number): string {
  if (avg >= 4.5) return 'text-green-400'
  if (avg >= 3.5) return 'text-blue-400'
  if (avg >= 2.5) return 'text-yellow-400'
  if (avg >= 1.5) return 'text-orange-400'
  return 'text-red-400'
}

export default function GradesPage() {
  const [activeTrimester, setActiveTrimester] = useState(0)
  const [grades, setGrades] = useState<GradeData>({})
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [showAddSubject, setShowAddSubject] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setGrades(loadGrades())
    setSubjects(loadSubjects())
  }, [])

  function updateGrades(updated: GradeData) {
    setGrades(updated)
    saveGrades(updated)
  }

  function ensurePath(data: GradeData, trimester: number, subject: string): GradeData {
    const updated = { ...data }
    if (!updated[trimester]) updated[trimester] = {}
    if (!updated[trimester][subject]) updated[trimester][subject] = emptySubjectGrades()
    else {
      updated[trimester][subject] = {
        test: updated[trimester][subject].test || [],
        pismeni: updated[trimester][subject].pismeni || [],
        usmeni: updated[trimester][subject].usmeni ?? null,
        zakljucna: updated[trimester][subject].zakljucna ?? null,
      }
    }
    return updated
  }

  function addMultiGrade(subject: string, type: 'test' | 'pismeni', value: number) {
    const updated = ensurePath({ ...grades }, activeTrimester, subject)
    updated[activeTrimester][subject][type] = [...updated[activeTrimester][subject][type], value]
    updateGrades(updated)
    setEditingCell(null)
  }

  function removeMultiGrade(subject: string, type: 'test' | 'pismeni', index: number) {
    const updated = ensurePath({ ...grades }, activeTrimester, subject)
    updated[activeTrimester][subject][type] = updated[activeTrimester][subject][type].filter((_, i) => i !== index)
    updateGrades(updated)
  }

  function setSingleGrade(subject: string, type: 'usmeni' | 'zakljucna', value: number | null) {
    const updated = ensurePath({ ...grades }, activeTrimester, subject)
    updated[activeTrimester][subject][type] = value
    updateGrades(updated)
    setEditingCell(null)
  }

  function addSubject(subject: string) {
    const updated = [...subjects, subject]
    setSubjects(updated)
    saveSubjects(updated)
    setShowAddSubject(false)
  }

  function removeSubject(subject: string) {
    const updated = subjects.filter(s => s !== subject)
    setSubjects(updated)
    saveSubjects(updated)
  }

  const trimesterData = grades[activeTrimester]
  const overallAvg = calcOverallAvg(trimesterData, subjects)
  const availableOptional = OPTIONAL_SUBJECTS.filter(s => !subjects.includes(s))

  function GradePicker({ onSelect }: { onSelect: (v: number) => void }) {
    return (
      <div className="flex gap-1 mt-1">
        {[5, 4, 3, 2, 1].map((v) => (
          <button
            key={v}
            onClick={() => onSelect(v)}
            className={`w-7 h-7 rounded-lg text-xs font-bold ${GRADE_COLORS[v]} transition-all active:scale-90`}
          >
            {v}
          </button>
        ))}
      </div>
    )
  }

  function GradeChip({ value, onRemove }: { value: number; onRemove: () => void }) {
    return (
      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${GRADE_COLORS[value]} ring-1 ${GRADE_RING[value]}`}>
        {value}
        <button onClick={onRemove} className="ml-0.5 opacity-70 hover:opacity-100">
          <X className="w-3 h-3" />
        </button>
      </span>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in pb-8 -mx-4 px-2">
      <div className="flex items-center gap-3 px-2">
        <button onClick={() => router.back()} className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-bold gradient-text">Moje ocjene</h1>
      </div>

      {/* Trimester tabs */}
      <div className="flex w-full">
        {TRIMESTER_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => setActiveTrimester(i)}
            className={`flex-1 py-2 text-sm font-medium transition-all ${
              activeTrimester === i
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            } ${i === 0 ? 'rounded-l-xl' : ''} ${i === 3 ? 'rounded-r-xl' : ''}`}
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
            <span className={`text-2xl font-bold ${avgColor(overallAvg)}`}>
              {overallAvg.toFixed(2)}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Subjects */}
      <div className="space-y-3">
        {subjects.map((subject) => {
          const sg = getSubjectData(grades, activeTrimester, subject)
          const isOptional = OPTIONAL_SUBJECTS.includes(subject)

          return (
            <Card key={subject} className="border-border/30 bg-card/50 backdrop-blur">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">{subject}</h3>
                  {isOptional && (
                    <button onClick={() => removeSubject(subject)} className="text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Test grades */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[11px] text-muted-foreground">Test</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {sg.test.map((v, idx) => (
                      <GradeChip key={idx} value={v} onRemove={() => removeMultiGrade(subject, 'test', idx)} />
                    ))}
                    {editingCell === `${activeTrimester}-${subject}-test` ? (
                      <GradePicker onSelect={(v) => addMultiGrade(subject, 'test', v)} />
                    ) : (
                      <button
                        onClick={() => setEditingCell(`${activeTrimester}-${subject}-test`)}
                        className="w-7 h-7 rounded-full bg-muted/50 text-muted-foreground border border-dashed border-border/50 flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Pismeni grades */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[11px] text-muted-foreground">Pismeni</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {sg.pismeni.map((v, idx) => (
                      <GradeChip key={idx} value={v} onRemove={() => removeMultiGrade(subject, 'pismeni', idx)} />
                    ))}
                    {editingCell === `${activeTrimester}-${subject}-pismeni` ? (
                      <GradePicker onSelect={(v) => addMultiGrade(subject, 'pismeni', v)} />
                    ) : (
                      <button
                        onClick={() => setEditingCell(`${activeTrimester}-${subject}-pismeni`)}
                        className="w-7 h-7 rounded-full bg-muted/50 text-muted-foreground border border-dashed border-border/50 flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Usmeni ispit */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Usmeni ispit</p>
                  {editingCell === `${activeTrimester}-${subject}-usmeni` ? (
                    <div className="flex gap-1">
                      {[5, 4, 3, 2, 1].map((v) => (
                        <button
                          key={v}
                          onClick={() => setSingleGrade(subject, 'usmeni', v)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold ${GRADE_COLORS[v]} transition-all active:scale-90`}
                        >
                          {v}
                        </button>
                      ))}
                      {sg.usmeni !== null && (
                        <button
                          onClick={() => setSingleGrade(subject, 'usmeni', null)}
                          className="w-7 h-7 rounded-lg text-[10px] bg-muted text-muted-foreground"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingCell(`${activeTrimester}-${subject}-usmeni`)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-all active:scale-90 ${
                        sg.usmeni
                          ? `${GRADE_COLORS[sg.usmeni]} ring-2 ${GRADE_RING[sg.usmeni]}`
                          : 'bg-muted/50 text-muted-foreground border border-dashed border-border/50'
                      }`}
                    >
                      {sg.usmeni || '—'}
                    </button>
                  )}
                </div>

                {/* Zaključna ocjena */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Zaključna ocjena</p>
                  {editingCell === `${activeTrimester}-${subject}-zakljucna` ? (
                    <div className="flex gap-1">
                      {[5, 4, 3, 2, 1].map((v) => (
                        <button
                          key={v}
                          onClick={() => setSingleGrade(subject, 'zakljucna', v)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold ${GRADE_COLORS[v]} transition-all active:scale-90`}
                        >
                          {v}
                        </button>
                      ))}
                      {sg.zakljucna !== null && (
                        <button
                          onClick={() => setSingleGrade(subject, 'zakljucna', null)}
                          className="w-7 h-7 rounded-lg text-[10px] bg-muted text-muted-foreground"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingCell(`${activeTrimester}-${subject}-zakljucna`)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-all active:scale-90 ${
                        sg.zakljucna
                          ? `${GRADE_COLORS[sg.zakljucna]} ring-2 ${GRADE_RING[sg.zakljucna]}`
                          : 'bg-muted/50 text-muted-foreground border border-dashed border-border/50'
                      }`}
                    >
                      {sg.zakljucna || '—'}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add subject button */}
      {availableOptional.length > 0 && (
        <div>
          {showAddSubject ? (
            <Card className="border-border/30 bg-card/50 backdrop-blur">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">Dodaj predmet</p>
                  <button onClick={() => setShowAddSubject(false)} className="text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {availableOptional.map((s) => (
                  <button
                    key={s}
                    onClick={() => addSubject(s)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-muted/50 text-sm hover:bg-muted transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </CardContent>
            </Card>
          ) : (
            <button
              onClick={() => setShowAddSubject(true)}
              className="w-full py-3 rounded-xl border border-dashed border-border/50 text-sm text-muted-foreground hover:bg-muted/30 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Dodaj predmet
            </button>
          )}
        </div>
      )}
    </div>
  )
}
