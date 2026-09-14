'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Plus, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

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

// Solid grade colours (palette §2): 5 green, 4 blue, 3 gold, 2 orange, 1 red.
// White text is allowed here because the background is a solid coloured fill.
const GRADE_COLORS: Record<number, string> = {
  5: 'bg-primary text-primary-foreground shadow-[0_2px_0_var(--color-primary-dark)]',
  4: 'bg-secondary text-[#FFFFFF] shadow-[0_2px_0_var(--color-secondary-dark)]',
  3: 'bg-gold text-[#4B4B4B] shadow-[0_2px_0_var(--color-gold-dark)]',
  2: 'bg-orange text-[#FFFFFF] shadow-[0_2px_0_color-mix(in_srgb,#FF9600_80%,black)]',
  1: 'bg-destructive text-destructive-foreground shadow-[0_2px_0_var(--color-destructive-dark)]',
}

// Subject tint for the leading 44px circle (§2 per-subject colours at 18% over white).
const SUBJECT_COLOR: Record<string, string> = {
  Fizika: '#1CB0F6',
  Matematika: '#58CC02',
  CSBH: '#FF4B4B',
  Hemija: '#CE82FF',
  Engleski: '#1CB0F6',
  Italjanski: '#58CC02',
  Fizicko: '#FF9600',
  Likovno: '#FF86D0',
  Biologija: '#58CC02',
  Istorija: '#FFC800',
  Geografija: '#1CB0F6',
  Njemacki: '#FFC800',
  Spanski: '#FF9600',
  'Izborni spanski': '#FF9600',
}

function subjectTint(subject: string): string {
  const c = SUBJECT_COLOR[subject] ?? '#1CB0F6'
  return `color-mix(in srgb, ${c} 18%, white)`
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

function avgLabel(avg: number): string {
  if (avg >= 4.5) return 'Odličan'
  if (avg >= 3.5) return 'Vrlo dobar'
  if (avg >= 2.5) return 'Dobar'
  if (avg >= 1.5) return 'Dovoljan'
  return 'Nedovoljan'
}

const SECTION_LABEL = 'text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground mb-2.5'

// §7 /grades: grade pickers 1–5 = 44px outline circles, selected = primary fill.
const PICK_BASE = 'size-11 rounded-full border-2 text-[15px] font-extrabold transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const PICK_OUTLINE = 'border-border bg-background text-secondary shadow-[0_2px_0_var(--color-border)]'
const PICK_SELECTED = 'border-primary bg-primary text-primary-foreground shadow-[0_2px_0_var(--color-primary-dark)]'

export default function GradesPage() {
  const [activeTrimester, setActiveTrimester] = useState(2) // III trimester (current)
  const [grades, setGrades] = useState<GradeData>({})
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)

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

  function GradePicker({ onSelect, selected = null }: { onSelect: (v: number) => void; selected?: number | null }) {
    return (
      <div className="flex flex-wrap gap-2 animate-fade-in">
        {[5, 4, 3, 2, 1].map((v) => (
          <button
            key={v}
            onClick={() => onSelect(v)}
            className={`${PICK_BASE} ${selected === v ? PICK_SELECTED : PICK_OUTLINE}`}
          >
            {v}
          </button>
        ))}
      </div>
    )
  }

  function GradeChip({ value, onRemove }: { value: number; onRemove: () => void }) {
    return (
      <span className={`inline-flex h-11 items-center gap-1 rounded-full pl-4 pr-1 text-[15px] font-extrabold ${GRADE_COLORS[value]}`}>
        {value}
        <button
          onClick={onRemove}
          className="flex size-9 items-center justify-center rounded-full opacity-80 transition-opacity hover:opacity-100"
          aria-label="Ukloni ocjenu"
        >
          <X className="size-4" strokeWidth={2.6} />
        </button>
      </span>
    )
  }

  function ZakljucnaCircle({ value }: { value: number | null }) {
    if (!value) return (
      <div className="flex size-11 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted">
        <span className="text-[15px] font-extrabold text-disabled">—</span>
      </div>
    )
    return (
      <div className={`flex size-11 items-center justify-center rounded-full text-[17px] font-black tabular-nums ${GRADE_COLORS[value]}`}>
        {value}
      </div>
    )
  }

  const avgPercent = overallAvg ? (overallAvg / 5) * 100 : 0

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading">Moje ocjene</h1>
      </div>

      {/* Trimester chips (§4.8) */}
      <div className="flex gap-2">
        {TRIMESTER_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => { setActiveTrimester(i); setExpandedSubject(null) }}
            className={`flex h-11 flex-1 items-center justify-center rounded-xl border-2 px-2 text-[12px] font-extrabold uppercase tracking-[0.04em] transition-[transform,box-shadow,background-color,color,border-color] duration-[80ms] active:translate-y-[2px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              activeTrimester === i
                ? 'border-secondary-light-border bg-secondary-light text-secondary shadow-[0_2px_0_var(--color-secondary-light-border)]'
                : 'border-border bg-background text-muted-foreground shadow-[0_2px_0_var(--color-border)]'
            }`}
          >
            {label} Tromj.
          </button>
        ))}
      </div>

      {/* Overall average card (§4.2 + big number + §4.9 progress) */}
      {overallAvg !== null && (
        <Card className="animate-card-appear gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <p className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Ukupan prosjek</p>
              <p className="text-[17px] font-extrabold leading-[1.3] text-heading">{avgLabel(overallAvg)}</p>
              <p className="text-[13px] font-bold text-muted-foreground">{gradedCount}/{subjects.length} predmeta</p>
            </div>
            <span className="shrink-0 text-[36px] font-black leading-none tabular-nums text-heading">
              {overallAvg.toFixed(2)}
            </span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary shadow-[inset_0_4px_0_rgba(255,255,255,0.3)] transition-[width] duration-700"
              style={{ width: `${avgPercent}%` }}
            />
          </div>
        </Card>
      )}

      {/* Subject accordion rows (§4.10) */}
      <div className="space-y-2.5 animate-stagger">
        {subjects.map((subject) => {
          const sg = getSubjectData(grades, activeTrimester, subject)
          const isOptional = OPTIONAL_SUBJECTS.includes(subject)
          const isExpanded = expandedSubject === subject

          return (
            <div
              key={subject}
              className={`overflow-hidden rounded-2xl border-2 bg-card transition-colors duration-200 ${
                isExpanded
                  ? 'border-primary-light-border shadow-[0_2px_0_var(--color-primary-light-border)]'
                  : 'border-border shadow-[0_2px_0_var(--color-border)]'
              }`}
            >
              {/* Collapsed header */}
              <button
                onClick={() => setExpandedSubject(isExpanded ? null : subject)}
                className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted active:bg-muted"
              >
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-full text-[17px] font-extrabold text-foreground"
                  style={{ backgroundColor: subjectTint(subject) }}
                >
                  {subject.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[17px] font-extrabold leading-[1.3] text-heading">{subject}</h3>
                  {!isExpanded && (sg.test.length > 0 || sg.pismeni.length > 0) && (
                    <p className="mt-0.5 text-[13px] font-bold text-muted-foreground">
                      {sg.test.length + sg.pismeni.length} ocjena
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <ZakljucnaCircle value={sg.zakljucna} />
                  <ChevronDown
                    strokeWidth={2.6}
                    className={`size-5 text-disabled transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="space-y-4 border-t-2 border-border px-4 pb-5 animate-expand">
                  {isOptional && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubject(subject)}
                      className="mt-3 h-11 px-3 text-destructive hover:text-destructive"
                    >
                      <Trash2 strokeWidth={2.6} /> Ukloni predmet
                    </Button>
                  )}

                  {/* Test grades */}
                  <div className="mt-3">
                    <p className={SECTION_LABEL}>Test</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {sg.test.map((v, idx) => (
                        <GradeChip key={idx} value={v} onRemove={() => removeMultiGrade(subject, 'test', idx)} />
                      ))}
                      {editingCell === `${activeTrimester}-${subject}-test` ? (
                        <GradePicker onSelect={(v) => addMultiGrade(subject, 'test', v)} />
                      ) : (
                        <button
                          onClick={() => setEditingCell(`${activeTrimester}-${subject}-test`)}
                          className="flex size-11 items-center justify-center rounded-full border-2 border-dashed border-border bg-background text-secondary transition-colors hover:bg-muted active:bg-muted"
                          aria-label="Dodaj ocjenu"
                        >
                          <Plus className="size-5" strokeWidth={2.6} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pismeni grades */}
                  <div>
                    <p className={SECTION_LABEL}>Pismeni</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {sg.pismeni.map((v, idx) => (
                        <GradeChip key={idx} value={v} onRemove={() => removeMultiGrade(subject, 'pismeni', idx)} />
                      ))}
                      {editingCell === `${activeTrimester}-${subject}-pismeni` ? (
                        <GradePicker onSelect={(v) => addMultiGrade(subject, 'pismeni', v)} />
                      ) : (
                        <button
                          onClick={() => setEditingCell(`${activeTrimester}-${subject}-pismeni`)}
                          className="flex size-11 items-center justify-center rounded-full border-2 border-dashed border-border bg-background text-secondary transition-colors hover:bg-muted active:bg-muted"
                          aria-label="Dodaj ocjenu"
                        >
                          <Plus className="size-5" strokeWidth={2.6} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Usmeni + Zaključna in a row */}
                  <div className="flex flex-wrap gap-6">
                    <div className="min-w-0 flex-1">
                      <p className={SECTION_LABEL}>Usmeni</p>
                      {editingCell === `${activeTrimester}-${subject}-usmeni` ? (
                        <div className="flex flex-wrap gap-2 animate-fade-in">
                          {[5, 4, 3, 2, 1].map((v) => (
                            <button
                              key={v}
                              onClick={() => setSingleGrade(subject, 'usmeni', v)}
                              className={`${PICK_BASE} ${sg.usmeni === v ? PICK_SELECTED : PICK_OUTLINE}`}
                            >
                              {v}
                            </button>
                          ))}
                          {sg.usmeni !== null && (
                            <button
                              onClick={() => setSingleGrade(subject, 'usmeni', null)}
                              className={`${PICK_BASE} ${PICK_OUTLINE} text-muted-foreground`}
                              aria-label="Obriši ocjenu"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingCell(`${activeTrimester}-${subject}-usmeni`)}
                          className={`flex size-11 items-center justify-center rounded-full text-[17px] font-black tabular-nums transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none ${
                            sg.usmeni
                              ? GRADE_COLORS[sg.usmeni]
                              : 'border-2 border-dashed border-border bg-muted text-disabled'
                          }`}
                        >
                          {sg.usmeni || '—'}
                        </button>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={SECTION_LABEL}>Zaključna</p>
                      {editingCell === `${activeTrimester}-${subject}-zakljucna` ? (
                        <div className="flex flex-wrap gap-2 animate-fade-in">
                          {[5, 4, 3, 2, 1].map((v) => (
                            <button
                              key={v}
                              onClick={() => setSingleGrade(subject, 'zakljucna', v)}
                              className={`${PICK_BASE} ${sg.zakljucna === v ? PICK_SELECTED : PICK_OUTLINE}`}
                            >
                              {v}
                            </button>
                          ))}
                          {sg.zakljucna !== null && (
                            <button
                              onClick={() => setSingleGrade(subject, 'zakljucna', null)}
                              className={`${PICK_BASE} ${PICK_OUTLINE} text-muted-foreground`}
                              aria-label="Obriši ocjenu"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingCell(`${activeTrimester}-${subject}-zakljucna`)}
                          className={`flex size-11 items-center justify-center rounded-full text-[17px] font-black tabular-nums transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none ${
                            sg.zakljucna
                              ? GRADE_COLORS[sg.zakljucna]
                              : 'border-2 border-dashed border-border bg-muted text-disabled'
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
            <Card className="animate-fade-in gap-2.5">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[17px] font-extrabold leading-[1.3] text-heading">Dodaj predmet</p>
                <Button variant="ghost" size="icon" onClick={() => setShowAddSubject(false)} className="text-muted-foreground" aria-label="Zatvori">
                  <X strokeWidth={2.6} />
                </Button>
              </div>
              {availableOptional.map((s) => (
                <button
                  key={s}
                  onClick={() => addSubject(s)}
                  className="flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-3 text-left shadow-[0_2px_0_var(--color-border)] transition-[transform,box-shadow,background-color] duration-[80ms] hover:bg-muted active:translate-y-[2px] active:shadow-none"
                >
                  <div
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-[17px] font-extrabold text-foreground"
                    style={{ backgroundColor: subjectTint(s) }}
                  >
                    {s.charAt(0)}
                  </div>
                  <span className="flex-1 text-[17px] font-extrabold leading-[1.3] text-heading">{s}</span>
                  <Plus className="size-5 text-disabled" strokeWidth={2.6} />
                </button>
              ))}
            </Card>
          ) : (
            <Button variant="outline" onClick={() => setShowAddSubject(true)} className="w-full">
              <Plus strokeWidth={2.6} />
              Dodaj predmet
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
