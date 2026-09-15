'use client'

import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, ChevronDown, DoorOpen, LogOut, Minus, RefreshCw, Sparkles, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { haptic } from '@/lib/haptics'
import { GoalCard, type GoalSubject } from './cilj'

/**
 * The connected eDnevnik screen: overall success, what changed lately, the
 * goal, subjects (weakest first) with the plan for each, absences.
 */

export interface DnevnikAbsence {
  date: string
  hours: number
  justified: boolean | null
}

export interface DnevnikData {
  user: { name: string; class: string } | null
  subjects: GoalSubject[]
  absences?: DnevnikAbsence[]
  fetchedAt: string
  demo?: boolean
}

const GRADE_HEX: Record<number, string> = { 5: '#58CC02', 4: '#1CB0F6', 3: '#FFC800', 2: '#FF9600', 1: '#FF4B4B' }
const GRADE_SOLID: Record<number, string> = {
  5: 'bg-primary text-primary-foreground shadow-[0_2px_0_var(--color-primary-dark)]',
  4: 'bg-secondary text-[#FFFFFF] shadow-[0_2px_0_var(--color-secondary-dark)]',
  3: 'bg-gold text-[#4B4B4B] shadow-[0_2px_0_var(--color-gold-dark)]',
  2: 'bg-orange text-[#FFFFFF] shadow-[0_2px_0_color-mix(in_srgb,#FF9600_80%,black)]',
  1: 'bg-destructive text-destructive-foreground shadow-[0_2px_0_var(--color-destructive-dark)]',
}
const GRADE_TINT: Record<number, string> = {
  5: 'bg-primary-light text-primary-text border-primary-light-border',
  4: 'bg-secondary-light text-secondary border-secondary-light-border',
  3: 'bg-[#FFF4C4] text-[#C79000] border-[#FFE28A]',
  2: 'bg-[color-mix(in_srgb,#FF9600_18%,white)] text-[color-mix(in_srgb,#FF9600_80%,black)] border-[color-mix(in_srgb,#FF9600_45%,white)]',
  1: 'bg-[#FFDFE0] text-[#EA2B2B] border-[#FFB3B5]',
}

const LABEL = 'text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground'

function fmt2(v: number | null | undefined) {
  return v === null || v === undefined ? '—' : v.toFixed(2).replace('.', ',')
}

/** Montenegrin "opšti uspjeh" bands. */
function successLabel(avg: number): { label: string; next: { label: string; at: number } | null } {
  if (avg >= 4.5) return { label: 'Odličan', next: null }
  if (avg >= 3.5) return { label: 'Vrlo dobar', next: { label: 'Odličan', at: 4.5 } }
  if (avg >= 2.5) return { label: 'Dobar', next: { label: 'Vrlo dobar', at: 3.5 } }
  if (avg >= 1.5) return { label: 'Dovoljan', next: { label: 'Dobar', at: 2.5 } }
  return { label: 'Nedovoljan', next: { label: 'Dovoljan', at: 1.5 } }
}

function finalOf(s: GoalSubject): number | null {
  if (s.finalGrade) return s.finalGrade
  if (s.average === null) return null
  return Math.min(5, Math.max(1, Math.floor(s.average + 0.5)))
}

/** "12.09.2026." / "2026-09-12" → sortable key + short label. */
function dateKey(d: string): string {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(d)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return d.slice(0, 10)
}
function shortDate(d: string): string {
  const k = dateKey(d)
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(k)
  if (!m) return d
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec']
  return `${Number(m[3])}. ${months[Number(m[2]) - 1]}`
}

/** Trend of the last two grades against the earlier ones. */
function trend(s: GoalSubject): 'up' | 'down' | 'flat' | null {
  if (s.grades.length < 3) return null
  const sorted = [...s.grades].sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)))
  const recent = sorted.slice(-2)
  const earlier = sorted.slice(0, -2)
  const r = recent.reduce((a, g) => a + g.grade, 0) / recent.length
  const e = earlier.reduce((a, g) => a + g.grade, 0) / earlier.length
  if (r - e > 0.3) return 'up'
  if (e - r > 0.3) return 'down'
  return 'flat'
}

/** What lifts the subject to the next final grade. */
function nextStep(s: GoalSubject): string | null {
  const f = finalOf(s)
  if (f === null || f >= 5 || s.average === null) return null
  const thr = f + 0.5
  const n = s.grades.length
  const sum = s.grades.reduce((a, g) => a + g.grade, 0)
  const need5 = Math.max(1, Math.ceil((thr * n - sum) / (5 - thr + 1e-9)))
  const need4 = thr < 4 ? Math.max(1, Math.ceil((thr * n - sum) / (4 - thr + 1e-9))) : null
  const five = need5 === 1 ? 'jedna petica' : need5 === 2 ? 'dvije petice' : need5 <= 4 ? `${need5} petice` : `${need5} petica`
  const four = need4 !== null && need4 <= 2 ? ` ili ${need4 === 1 ? 'jedna četvorka' : 'dvije četvorke'}` : ''
  return `Za zaključnu ${f + 1}: ${five}${four}.`
}

/** Risk of dropping a final grade: average less than 0.2 above the threshold. */
function dropRisk(s: GoalSubject): boolean {
  const f = finalOf(s)
  return f !== null && f > 1 && s.average !== null && s.average - (f - 0.5) < 0.2
}

export function DnevnikView({ data, loading, onRefresh, onLogout }: { data: DnevnikData; loading: boolean; onRefresh: () => void; onLogout: () => void }) {
  const [sort, setSort] = useState<'weak' | 'abc'>('weak')
  const [open, setOpen] = useState<string | null>(null)

  const graded = data.subjects.filter((s) => s.grades.length > 0 || s.finalGrade)
  const finals = graded.map((s) => finalOf(s)).filter((v): v is number => v !== null)
  const overall = finals.length ? finals.reduce((a, b) => a + b, 0) / finals.length : null
  const success = overall !== null ? successLabel(overall) : null
  const allGrades = data.subjects.flatMap((s) => s.grades.map((g) => ({ ...g, subject: s.name })))
  const counts = [1, 2, 3, 4, 5].map((v) => allGrades.filter((g) => g.grade === v).length)
  const recent = [...allGrades].sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date))).slice(0, 6)
  const weekKey = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().slice(0, 10)
  }, [])
  const thisWeek = allGrades.filter((g) => dateKey(g.date) >= weekKey).length

  const subjects = useMemo(() => {
    const list = [...data.subjects]
    if (sort === 'abc') list.sort((a, b) => a.name.localeCompare(b.name, 'sr-Latn'))
    else list.sort((a, b) => (a.average ?? 6) - (b.average ?? 6))
    return list
  }, [data.subjects, sort])

  const absences = data.absences ?? []
  const absHours = absences.reduce((a, x) => a + x.hours, 0)
  const absUnj = absences.filter((x) => x.justified === false).reduce((a, x) => a + x.hours, 0)

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      <div className="flex items-start justify-between gap-2 pt-1">
        <div className="min-w-0">
          <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading">eDnevnik</h1>
          {data.user && (
            <p className="mt-0.5 flex items-center gap-2 text-[13px] font-bold text-muted-foreground">
              <span className="truncate">{data.user.name} · {data.user.class}</span>
              {data.demo && <Badge variant="gold">Demo</Badge>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button type="button" onClick={() => { haptic(); onRefresh() }} disabled={loading} aria-label="Osvježi" className="w-11 h-11 rounded-xl bg-background border-2 border-border shadow-[0_2px_0_var(--color-border)] flex items-center justify-center text-secondary transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none disabled:opacity-60">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} strokeWidth={2.6} />
          </button>
          <button type="button" onClick={onLogout} aria-label="Odjavi eDnevnik" className="w-11 h-11 rounded-xl bg-background border-2 border-border shadow-[0_2px_0_var(--color-border)] flex items-center justify-center text-destructive transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none">
            <LogOut className="w-5 h-5" strokeWidth={2.6} />
          </button>
        </div>
      </div>

      {/* Success hero */}
      {overall !== null && success ? (
        <Card className="gap-3">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className={LABEL}>Opšti uspjeh</p>
              <p className="text-[24px] leading-[1.15] font-extrabold text-heading">{success.label}</p>
              <p className="text-[13px] font-bold text-muted-foreground">{finals.length} od {data.subjects.length} predmeta ima zaključnu · {allGrades.length} ocjena</p>
            </div>
            <span className="shrink-0 text-[44px] font-black leading-none tabular-nums" style={{ color: GRADE_HEX[Math.min(5, Math.max(1, Math.round(overall)))] }}>{fmt2(overall)}</span>
          </div>
          {success.next ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[12px] font-extrabold text-muted-foreground">
                <span>Do „{success.next.label}” ({fmt2(success.next.at)})</span>
                <span className="tabular-nums">još {fmt2(success.next.at - overall)}</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-primary shadow-[inset_0_4px_0_rgba(255,255,255,0.3)] transition-[width] duration-700" style={{ width: `${Math.min(100, Math.max(6, ((overall - (success.next.at - 1)) / 1) * 100))}%` }} />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-[#B8F28B] bg-[#F1FBE8] px-3 py-2 text-[13px] font-extrabold text-heading">Najviši uspjeh — drži ga do kraja polugodišta.</div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-muted py-2.5 text-center">
              <span className="block text-[20px] leading-none font-extrabold tabular-nums text-heading">{thisWeek}</span>
              <span className="block mt-1 text-[10px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">ove sedmice</span>
            </div>
            <div className="rounded-xl bg-muted py-2.5 text-center">
              <span className="block text-[20px] leading-none font-extrabold tabular-nums text-[#58A700]">{counts[4]}</span>
              <span className="block mt-1 text-[10px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">petica</span>
            </div>
            <div className="rounded-xl bg-muted py-2.5 text-center">
              <span className="block text-[20px] leading-none font-extrabold tabular-nums" style={{ color: counts[0] + counts[1] > 0 ? '#FF4B4B' : '#3C3C3C' }}>{counts[0] + counts[1]}</span>
              <span className="block mt-1 text-[10px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">slabih (1–2)</span>
            </div>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-border" aria-hidden="true">
            {counts.map((n, i) => (
              <span key={i} style={{ width: `${(n / Math.max(1, allGrades.length)) * 100}%`, background: GRADE_HEX[i + 1] }} />
            ))}
          </div>
        </Card>
      ) : (
        <Card><p className="text-[13px] font-bold text-muted-foreground">Još nema ocjena u dnevniku.</p></Card>
      )}

      {/* Latest grades */}
      {recent.length > 0 && (
        <section className="space-y-2.5">
          <p className={`${LABEL} px-1`}>Najnovije ocjene</p>
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {recent.map((g, i) => (
              <div key={i} className="flex-shrink-0 w-[132px] rounded-2xl border-2 border-border bg-card px-3 py-2.5 shadow-[0_2px_0_var(--color-border)]">
                <div className="flex items-center justify-between gap-2">
                  <span className={`flex size-9 items-center justify-center rounded-full text-[16px] font-black tabular-nums ${GRADE_SOLID[g.grade]}`}>{g.grade}</span>
                  <span className="text-[11px] font-bold text-muted-foreground">{shortDate(g.date)}</span>
                </div>
                <p className="mt-2 text-[13px] font-extrabold text-heading truncate">{g.subject}</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-muted-foreground truncate">{g.type}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <GoalCard subjects={data.subjects} />

      {/* Subjects */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <p className={LABEL}>Predmeti</p>
          <div className="flex gap-1">
            {([['weak', 'Najslabije'], ['abc', 'A–Ž']] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setSort(k)} className={`h-9 px-3 rounded-lg border-2 text-[11px] font-extrabold uppercase tracking-[0.04em] ${sort === k ? 'border-[#84D8FF] bg-[#DDF4FF] text-secondary' : 'border-border bg-background text-muted-foreground'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="space-y-2.5">
          {subjects.map((s) => {
            const isOpen = open === s.name
            const f = finalOf(s)
            const t = trend(s)
            const risk = dropRisk(s)
            const step = nextStep(s)
            const sortedGrades = [...s.grades].sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)))
            return (
              <div key={s.name} className={`overflow-hidden rounded-2xl border-2 bg-card transition-colors ${isOpen ? 'border-primary-light-border shadow-[0_2px_0_var(--color-primary-light-border)]' : 'border-border shadow-[0_2px_0_var(--color-border)]'}`}>
                <button type="button" onClick={() => { setOpen(isOpen ? null : s.name); haptic(5) }} className="flex min-h-16 w-full items-center gap-3 px-3.5 py-3 text-left active:bg-muted">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-[16px] font-extrabold leading-[1.3] text-heading">{s.name}</h3>
                      {t === 'up' && <ArrowUpRight className="w-4 h-4 text-[#58A700] flex-shrink-0" strokeWidth={2.8} />}
                      {t === 'down' && <ArrowDownRight className="w-4 h-4 text-[#FF4B4B] flex-shrink-0" strokeWidth={2.8} />}
                      {t === 'flat' && <Minus className="w-4 h-4 text-disabled flex-shrink-0" strokeWidth={2.8} />}
                      {risk && <Badge variant="destructive">pazi</Badge>}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="flex gap-[3px]" aria-hidden="true">
                        {sortedGrades.slice(-8).map((g, i) => <span key={i} className="w-3 h-3 rounded-[3px]" style={{ background: GRADE_HEX[g.grade] }} />)}
                        {sortedGrades.length === 0 && <span className="text-[12px] font-bold text-disabled">nema ocjena</span>}
                      </span>
                      {s.average !== null && <span className="text-[12px] font-bold text-muted-foreground tabular-nums">Ø {fmt2(s.average)}</span>}
                    </div>
                  </div>
                  {f ? (
                    <div className={`flex size-11 items-center justify-center rounded-full text-[17px] font-black tabular-nums ${GRADE_SOLID[f]}`}>{f}</div>
                  ) : (
                    <div className="flex size-11 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted text-[15px] font-extrabold text-disabled">—</div>
                  )}
                  <ChevronDown strokeWidth={2.6} className={`size-5 text-disabled transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="space-y-3 border-t-2 border-border px-3.5 pb-4 pt-3 animate-fade-in">
                    {s.average !== null && (
                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className={LABEL}>Prosjek</span>
                          <span className="text-[15px] font-extrabold tabular-nums text-heading">{fmt2(s.average)}{f && <span className="text-muted-foreground font-bold"> · zaključna {f}</span>}</span>
                        </div>
                        <div className="relative h-4 w-full overflow-hidden rounded-full bg-border">
                          <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${((s.average - 1) / 4) * 100}%`, backgroundColor: GRADE_HEX[Math.round(s.average)] || '#AFAFAF' }} />
                          {[1.5, 2.5, 3.5, 4.5].map((th) => <span key={th} className="absolute top-0 bottom-0 w-[2px] bg-background/80" style={{ left: `${((th - 1) / 4) * 100}%` }} />)}
                        </div>
                      </div>
                    )}
                    {sortedGrades.length > 0 && (
                      <div>
                        <p className={`${LABEL} mb-2`}>Ocjene po redu</p>
                        <div className="flex flex-wrap gap-2">
                          {sortedGrades.map((g, idx) => (
                            <div key={idx} className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border-2 px-3 py-1 ${GRADE_TINT[g.grade] || 'border-border bg-background text-muted-foreground'}`}>
                              <span className="text-[15px] font-black tabular-nums">{g.grade}</span>
                              {g.type && <span className="text-[11px] font-bold uppercase tracking-[0.04em]">{g.type}</span>}
                              {g.date && <span className="text-[11px] font-bold">{shortDate(g.date)}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(step || risk) && (
                      <div className="rounded-xl border-2 border-[#FFE28A] bg-[#FFF9E0] px-3 py-2 text-[13px] font-bold text-heading space-y-1">
                        {step && <p className="flex items-start gap-1.5"><Sparkles className="w-4 h-4 text-[#C79000] flex-shrink-0 mt-0.5" strokeWidth={2.6} /><span>{step}</span></p>}
                        {risk && f && <p className="flex items-start gap-1.5"><Star className="w-4 h-4 text-[#FF4B4B] flex-shrink-0 mt-0.5" strokeWidth={2.6} /><span>Prosjek je tik iznad {f - 1},50 — jedna slaba ocjena spušta zaključnu na {f - 1}.</span></p>}
                      </div>
                    )}
                    {sortedGrades.length === 0 && <p className="text-[13px] font-bold text-muted-foreground">Nema unesenih ocjena.</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Absences */}
      <section className="space-y-2.5">
        <p className={`${LABEL} px-1`}>Izostanci</p>
        <Card className="gap-3">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-[#FFF3E0] text-[#C96A00] flex items-center justify-center flex-shrink-0"><DoorOpen className="w-5 h-5" strokeWidth={2.6} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[18px] leading-[1.25] font-extrabold text-heading tabular-nums">{absHours} {absHours === 1 ? 'čas' : absHours >= 2 && absHours <= 4 ? 'časa' : 'časova'}</p>
              <p className="text-[13px] font-bold text-muted-foreground">{absences.length === 0 ? 'Dnevnik nema izostanaka.' : `${absHours - absUnj} opravdano · ${absUnj} neopravdano`}</p>
            </div>
          </div>
          {absences.length > 0 && (
            <>
              <div className="flex h-3 rounded-full overflow-hidden bg-border">
                <span style={{ width: `${((absHours - absUnj) / Math.max(1, absHours)) * 100}%` }} className="bg-[#84D8FF]" />
                <span style={{ width: `${(absUnj / Math.max(1, absHours)) * 100}%` }} className="bg-[#FF4B4B]" />
              </div>
              {absUnj >= 10 ? (
                <p className="rounded-xl border-2 border-[#FFB3B5] bg-[#FFF3F3] px-3 py-2 text-[13px] font-extrabold text-heading">{absUnj} neopravdanih — ovo već utiče na ocjenu iz vladanja. Opravdaj šta možeš kod razrednog.</p>
              ) : absUnj > 0 ? (
                <p className="text-[13px] font-bold text-muted-foreground">Neopravdane opravdaj kod razrednog u roku od 8 dana.</p>
              ) : null}
              <div className="space-y-1">
                {[...absences].sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date))).slice(0, 5).map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-[13px] font-bold min-h-9">
                    <span className="text-heading">{shortDate(a.date)} · {a.hours} {a.hours === 1 ? 'čas' : 'časa'}</span>
                    <Badge variant={a.justified === false ? 'destructive' : a.justified ? 'secondary' : 'outline'}>{a.justified === false ? 'neopravdano' : a.justified ? 'opravdano' : 'u obradi'}</Badge>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </section>

      {data.fetchedAt && (
        <p className="text-center text-[12px] font-bold text-muted-foreground">Preuzeto {new Date(data.fetchedAt).toLocaleString('sr-Latn', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}{data.demo ? ' · demo podaci' : ''}</p>
      )}
    </div>
  )
}
