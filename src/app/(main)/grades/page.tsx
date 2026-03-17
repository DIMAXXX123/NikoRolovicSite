'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronDown, Plus, X, Trash2 } from 'lucide-react'
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
  5: 'bg-emerald-500 text-white',
  4: 'bg-sky-500 text-white',
  3: 'bg-amber-500 text-white',
  2: 'bg-orange-500 text-white',
  1: 'bg-red-500 text-white',
}

const GRADE_BG: Record<number, string> = {
  5: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  4: 'bg-sky-500/15 text-sky-400 ring-sky-500/30',
  3: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  2: 'bg-orange-500/15 text-orange-400 ring-orange-500/30',
  1: 'bg-red-500/15 text-red-400 ring-red-500/30',
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

function avgGradient(avg: number): string {
  if (avg >= 4.5) return 'from-emerald-600 to-teal-500'
  if (avg >= 3.5) return 'from-sky-600 to-cyan-500'
  if (avg >= 2.5) return 'from-amber-600 to-yellow-500'
  if (avg >= 1.5) return 'from-orange-600 to-amber-500'
  return 'from-red-600 to-rose-500'
}

function avgLabel(avg: number): string {
  if (avg >= 4.5) return 'Odličan'
  if (avg >= 3.5) return 'Vrlo dobar'
  if (avg >= 2.5) return 'Dobar'
  if (avg >= 1.5) return 'Dovoljan'
  return 'Nedovoljan'
}

export default function GradesPage() {
  const [activeTrimester, setActiveTrimester] = useState(0)
  const [grades, setGrades] = useState<GradeData>({})
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)
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
  const gradedCount = trimesterData
    ? subjects.filter(s => trimesterData[s]?.zakljucna && trimesterData[s].zakljucna! > 0).length
    : 0

  function GradePicker({ onSelect }: { onSelect: (v: number) => void }) {
    return (
      <div className="flex gap-1.5 mt-1">
        {[5, 4, 3, 2, 1].map((v) => (
          <button
            key={v}
            onClick={() => onSelect(v)}
            className={`w-8 h-8 rounded-xl text-xs font-bold ${GRADE_COLORS[v]} transition-all active:scale-90 shadow-sm`}
          >
            {v}
          </button>
        ))}
      </div>
    )
  }

  function GradeChip({ value, onRemove }: { value: number; onRemove: () => void }) {
    return (
      <span className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-xl text-xs font-bold ${GRADE_COLORS[value]} shadow-sm`}>
        {value}
        <button onClick={onRemove} className="ml-0.5 opacity-70 hover:opacity-100">
          <X className="w-3 h-3" />
        </button>
      </span>
    )
  }

  function ZakljucnaCircle({ value }: { value: number | null }) {
    if (!value) return (
      <div className="w-9 h-9 rounded-full bg-muted/40 border border-dashed border-border/40 flex items-center justify-center">
        <span className="text-xs text-muted-foreground">—</span>
      </div>
    )
    return (
      <div className={`w-9 h-9 rounded-full ${GRADE_COLORS[value]} flex items-center justify-center shadow-md font-bold text-sm`}>
        {value}
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in pb-8 -mx-4 px-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold gradient-text">Moje ocjene</h1>
        </div>
      </div>

      {/* Trimester pills */}
      <div className="flex gap-2 p-1 bg-muted/30 rounded-2xl">
        {TRIMESTER_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => { setActiveTrimester(i); setExpandedSubject(null) }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
              activeTrimester === i
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label} Tromj.
          </button>
        ))}
      </div>

      {/* Overall average card */}
      {overallAvg !== null && (
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${avgGradient(overallAvg)} p-5 shadow-xl`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-white/70 text-sm font-medium">Ukupan prosjek</p>
              <p className="text-white text-lg font-semibold">{avgLabel(overallAvg)}</p>
              <p className="text-white/60 text-xs">{gradedCount}/{subjects.length} predmeta</p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-black text-white drop-shadow-lg">{overallAvg.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Subject cards */}
      <div className="space-y-2.5">
        {subjects.map((subject) => {
          const sg = getSubjectData(grades, activeTrimester, subject)
          const isOptional = OPTIONAL_SUBJECTS.includes(subject)
          const isExpanded = expandedSubject === subject

          return (
            <div
              key={subject}
              className="rounded-2xl border border-border/20 bg-card/60 backdrop-blur overflow-hidden transition-all duration-300"
            >
              {/* Collapsed header - always visible */}
              <button
                onClick={() => setExpandedSubject(isExpanded ? null : subject)}
                className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/20"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{subject}</h3>
                  {!isExpanded && (sg.test.length > 0 || sg.pismeni.length > 0) && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {sg.test.length + sg.pismeni.length} ocjena
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <ZakljucnaCircle value={sg.zakljucna} />
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 animate-fade-in border-t border-border/10">
                  {isOptional && (
                    <button
                      onClick={() => removeSubject(subject)}
                      className="text-xs text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1 mt-2"
                    >
                      <Trash2 className="w-3 h-3" /> Ukloni predmet
                    </button>
                  )}

                  {/* Test grades */}
                  <div className="mt-3">
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Test</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {sg.test.map((v, idx) => (
                        <GradeChip key={idx} value={v} onRemove={() => removeMultiGrade(subject, 'test', idx)} />
                      ))}
                      {editingCell === `${activeTrimester}-${subject}-test` ? (
                        <GradePicker onSelect={(v) => addMultiGrade(subject, 'test', v)} />
                      ) : (
                        <button
                          onClick={() => setEditingCell(`${activeTrimester}-${subject}-test`)}
                          className="w-8 h-8 rounded-xl bg-muted/30 text-muted-foreground border border-dashed border-border/40 flex items-center justify-center hover:bg-muted/50 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pismeni grades */}
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Pismeni</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {sg.pismeni.map((v, idx) => (
                        <GradeChip key={idx} value={v} onRemove={() => removeMultiGrade(subject, 'pismeni', idx)} />
                      ))}
                      {editingCell === `${activeTrimester}-${subject}-pismeni` ? (
                        <GradePicker onSelect={(v) => addMultiGrade(subject, 'pismeni', v)} />
                      ) : (
                        <button
                          onClick={() => setEditingCell(`${activeTrimester}-${subject}-pismeni`)}
                          className="w-8 h-8 rounded-xl bg-muted/30 text-muted-foreground border border-dashed border-border/40 flex items-center justify-center hover:bg-muted/50 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Usmeni + Zaključna in a row */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Usmeni</p>
                      {editingCell === `${activeTrimester}-${subject}-usmeni` ? (
                        <div className="flex gap-1.5">
                          {[5, 4, 3, 2, 1].map((v) => (
                            <button
                              key={v}
                              onClick={() => setSingleGrade(subject, 'usmeni', v)}
                              className={`w-8 h-8 rounded-xl text-xs font-bold ${GRADE_COLORS[v]} transition-all active:scale-90 shadow-sm`}
                            >
                              {v}
                            </button>
                          ))}
                          {sg.usmeni !== null && (
                            <button
                              onClick={() => setSingleGrade(subject, 'usmeni', null)}
                              className="w-8 h-8 rounded-xl text-[10px] bg-muted text-muted-foreground"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingCell(`${activeTrimester}-${subject}-usmeni`)}
                          className={`w-10 h-10 rounded-xl text-sm font-bold transition-all active:scale-90 ring-1 ${
                            sg.usmeni
                              ? `${GRADE_BG[sg.usmeni]}`
                              : 'bg-muted/30 text-muted-foreground border border-dashed border-border/40 ring-0'
                          }`}
                        >
                          {sg.usmeni || '—'}
                        </button>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Zaključna</p>
                      {editingCell === `${activeTrimester}-${subject}-zakljucna` ? (
                        <div className="flex gap-1.5">
                          {[5, 4, 3, 2, 1].map((v) => (
                            <button
                              key={v}
                              onClick={() => setSingleGrade(subject, 'zakljucna', v)}
                              className={`w-8 h-8 rounded-xl text-xs font-bold ${GRADE_COLORS[v]} transition-all active:scale-90 shadow-sm`}
                            >
                              {v}
                            </button>
                          ))}
                          {sg.zakljucna !== null && (
                            <button
                              onClick={() => setSingleGrade(subject, 'zakljucna', null)}
                              className="w-8 h-8 rounded-xl text-[10px] bg-muted text-muted-foreground"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingCell(`${activeTrimester}-${subject}-zakljucna`)}
                          className={`w-10 h-10 rounded-xl text-sm font-bold transition-all active:scale-90 ring-1 ${
                            sg.zakljucna
                              ? `${GRADE_BG[sg.zakljucna]}`
                              : 'bg-muted/30 text-muted-foreground border border-dashed border-border/40 ring-0'
                          }`}
                        >
                          {sg.zakljucna || '—'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add subject button */}
      {availableOptional.length > 0 && (
        <div>
          {showAddSubject ? (
            <div className="rounded-2xl border border-border/20 bg-card/60 backdrop-blur p-4 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold">Dodaj predmet</p>
                <button onClick={() => setShowAddSubject(false)} className="text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {availableOptional.map((s) => (
                <button
                  key={s}
                  onClick={() => addSubject(s)}
                  className="w-full text-left px-4 py-2.5 rounded-xl bg-muted/30 text-sm hover:bg-muted/50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => setShowAddSubject(true)}
              className="w-full py-3.5 rounded-2xl border border-dashed border-border/40 text-sm text-muted-foreground hover:bg-muted/20 hover:border-primary/40 transition-all flex items-center justify-center gap-2"
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
