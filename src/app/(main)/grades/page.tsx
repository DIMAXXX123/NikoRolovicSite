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

const GRADE_SHADOW: Record<number, string> = {
  5: 'shadow-emerald-500/20',
  4: 'shadow-sky-500/20',
  3: 'shadow-amber-500/20',
  2: 'shadow-orange-500/20',
  1: 'shadow-red-500/20',
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

function avgStrokeColor(avg: number): string {
  if (avg >= 4.5) return '#10b981'
  if (avg >= 3.5) return '#0ea5e9'
  if (avg >= 2.5) return '#f59e0b'
  if (avg >= 1.5) return '#f97316'
  return '#ef4444'
}

export default function GradesPage() {
  const [activeTrimester, setActiveTrimester] = useState(2) // III trimester (current)
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
      <div className="flex gap-1.5 mt-1 animate-fade-in">
        {[5, 4, 3, 2, 1].map((v) => (
          <button
            key={v}
            onClick={() => onSelect(v)}
            className={`w-9 h-9 rounded-xl text-xs font-bold ${GRADE_COLORS[v]} transition-all active:scale-90 shadow-md ${GRADE_SHADOW[v]}`}
          >
            {v}
          </button>
        ))}
      </div>
    )
  }

  function GradeChip({ value, onRemove }: { value: number; onRemove: () => void }) {
    return (
      <span className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-xl text-xs font-bold ${GRADE_COLORS[value]} shadow-md ${GRADE_SHADOW[value]}`}>
        {value}
        <button onClick={onRemove} className="ml-0.5 opacity-70 hover:opacity-100">
          <X className="w-3 h-3" />
        </button>
      </span>
    )
  }

  function ZakljucnaCircle({ value }: { value: number | null }) {
    if (!value) return (
      <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-dashed border-white/[0.1] flex items-center justify-center">
        <span className="text-xs text-muted-foreground/50">—</span>
      </div>
    )
    return (
      <div className={`w-10 h-10 rounded-full ${GRADE_COLORS[value]} flex items-center justify-center shadow-lg ${GRADE_SHADOW[value]} font-bold text-sm`}>
        {value}
      </div>
    )
  }

  // Circular progress SVG for average
  const circumference = 2 * Math.PI * 44
  const avgPercent = overallAvg ? (overallAvg / 5) * 100 : 0
  const offset = circumference - (avgPercent / 100) * circumference

  return (
    <div className="space-y-5 animate-fade-in pb-8 -mx-4 px-3">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <button onClick={() => router.back()} className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-bold gradient-text">Moje ocjene</h1>
      </div>

      {/* Trimester pills */}
      <div className="flex gap-2 p-1.5 bg-white/[0.03] rounded-2xl border border-white/[0.04]">
        {TRIMESTER_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => { setActiveTrimester(i); setExpandedSubject(null) }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
              activeTrimester === i
                ? 'bg-gradient-to-br from-purple-500 to-violet-700 text-white shadow-lg shadow-purple-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
            }`}
          >
            {label} Tromj.
          </button>
        ))}
      </div>

      {/* Overall average card with circular progress */}
      {overallAvg !== null && (
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${avgGradient(overallAvg)} p-6 shadow-xl`}>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex items-center justify-between">
            <div className="space-y-1.5">
              <p className="text-white/70 text-sm font-medium">Ukupan prosjek</p>
              <p className="text-white text-lg font-bold">{avgLabel(overallAvg)}</p>
              <p className="text-white/50 text-xs font-medium">{gradedCount}/{subjects.length} predmeta</p>
            </div>

            {/* Circular progress */}
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
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.3))' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white drop-shadow-lg">{overallAvg.toFixed(2)}</span>
              </div>
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
              className="rounded-2xl border border-white/[0.04] bg-card/40 backdrop-blur-sm overflow-hidden transition-all duration-300"
            >
              {/* Collapsed header */}
              <button
                onClick={() => setExpandedSubject(isExpanded ? null : subject)}
                className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-white/[0.02] active:bg-white/[0.04]"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{subject}</h3>
                  {!isExpanded && (sg.test.length > 0 || sg.pismeni.length > 0) && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {sg.test.length + sg.pismeni.length} ocjena
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <ZakljucnaCircle value={sg.zakljucna} />
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-5 space-y-4 animate-fade-in border-t border-white/[0.04]">
                  {isOptional && (
                    <button
                      onClick={() => removeSubject(subject)}
                      className="text-xs text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1 mt-3"
                    >
                      <Trash2 className="w-3 h-3" /> Ukloni predmet
                    </button>
                  )}

                  {/* Test grades */}
                  <div className="mt-3">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-2.5">Test</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {sg.test.map((v, idx) => (
                        <GradeChip key={idx} value={v} onRemove={() => removeMultiGrade(subject, 'test', idx)} />
                      ))}
                      {editingCell === `${activeTrimester}-${subject}-test` ? (
                        <GradePicker onSelect={(v) => addMultiGrade(subject, 'test', v)} />
                      ) : (
                        <button
                          onClick={() => setEditingCell(`${activeTrimester}-${subject}-test`)}
                          className="w-9 h-9 rounded-xl bg-white/[0.04] text-muted-foreground border border-dashed border-white/[0.1] flex items-center justify-center hover:bg-white/[0.08] hover:border-purple-500/30 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pismeni grades */}
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-2.5">Pismeni</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {sg.pismeni.map((v, idx) => (
                        <GradeChip key={idx} value={v} onRemove={() => removeMultiGrade(subject, 'pismeni', idx)} />
                      ))}
                      {editingCell === `${activeTrimester}-${subject}-pismeni` ? (
                        <GradePicker onSelect={(v) => addMultiGrade(subject, 'pismeni', v)} />
                      ) : (
                        <button
                          onClick={() => setEditingCell(`${activeTrimester}-${subject}-pismeni`)}
                          className="w-9 h-9 rounded-xl bg-white/[0.04] text-muted-foreground border border-dashed border-white/[0.1] flex items-center justify-center hover:bg-white/[0.08] hover:border-purple-500/30 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Usmeni + Zaključna in a row */}
                  <div className="flex gap-6">
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-2.5">Usmeni</p>
                      {editingCell === `${activeTrimester}-${subject}-usmeni` ? (
                        <div className="flex gap-1.5 animate-fade-in">
                          {[5, 4, 3, 2, 1].map((v) => (
                            <button
                              key={v}
                              onClick={() => setSingleGrade(subject, 'usmeni', v)}
                              className={`w-9 h-9 rounded-xl text-xs font-bold ${GRADE_COLORS[v]} transition-all active:scale-90 shadow-md ${GRADE_SHADOW[v]}`}
                            >
                              {v}
                            </button>
                          ))}
                          {sg.usmeni !== null && (
                            <button
                              onClick={() => setSingleGrade(subject, 'usmeni', null)}
                              className="w-9 h-9 rounded-xl text-[10px] bg-white/[0.04] text-muted-foreground border border-white/[0.08]"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingCell(`${activeTrimester}-${subject}-usmeni`)}
                          className={`w-11 h-11 rounded-xl text-sm font-bold transition-all active:scale-90 ring-1 ${
                            sg.usmeni
                              ? `${GRADE_BG[sg.usmeni]}`
                              : 'bg-white/[0.04] text-muted-foreground/50 border border-dashed border-white/[0.1] ring-0'
                          }`}
                        >
                          {sg.usmeni || '—'}
                        </button>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-2.5">Zaključna</p>
                      {editingCell === `${activeTrimester}-${subject}-zakljucna` ? (
                        <div className="flex gap-1.5 animate-fade-in">
                          {[5, 4, 3, 2, 1].map((v) => (
                            <button
                              key={v}
                              onClick={() => setSingleGrade(subject, 'zakljucna', v)}
                              className={`w-9 h-9 rounded-xl text-xs font-bold ${GRADE_COLORS[v]} transition-all active:scale-90 shadow-md ${GRADE_SHADOW[v]}`}
                            >
                              {v}
                            </button>
                          ))}
                          {sg.zakljucna !== null && (
                            <button
                              onClick={() => setSingleGrade(subject, 'zakljucna', null)}
                              className="w-9 h-9 rounded-xl text-[10px] bg-white/[0.04] text-muted-foreground border border-white/[0.08]"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingCell(`${activeTrimester}-${subject}-zakljucna`)}
                          className={`w-11 h-11 rounded-xl text-sm font-bold transition-all active:scale-90 ring-1 ${
                            sg.zakljucna
                              ? `${GRADE_BG[sg.zakljucna]}`
                              : 'bg-white/[0.04] text-muted-foreground/50 border border-dashed border-white/[0.1] ring-0'
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
            <div className="rounded-2xl border border-white/[0.04] bg-card/40 backdrop-blur-sm p-5 space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold">Dodaj predmet</p>
                <button onClick={() => setShowAddSubject(false)} className="text-muted-foreground p-1 rounded-lg hover:bg-white/[0.04]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {availableOptional.map((s) => (
                <button
                  key={s}
                  onClick={() => addSubject(s)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.04] text-sm font-medium hover:bg-white/[0.08] transition-all active:scale-[0.98]"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => setShowAddSubject(true)}
              className="w-full py-4 rounded-2xl border border-dashed border-white/[0.08] text-sm text-muted-foreground hover:bg-white/[0.02] hover:border-purple-500/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
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
