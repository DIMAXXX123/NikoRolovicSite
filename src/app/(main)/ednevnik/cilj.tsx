'use client'

import { useMemo, useState } from 'react'
import { Target, TrendingDown, TrendingUp, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { haptic } from '@/lib/haptics'

/**
 * "Cilj" — the pupil sets the average they aim for and the card says which
 * subjects to raise and by how many grades. Works on real eDnevnik data and on
 * the demo set from makeDemoData().
 *
 * Montenegrin rules used here: a subject's final grade (zaključna) is its
 * average rounded (x,50 rounds up); the overall average is the mean of the
 * final grades.
 */

export interface GoalGrade {
  grade: number
  type: string
  date: string
}
export interface GoalSubject {
  name: string
  grades: GoalGrade[]
  finalGrade: number | null
  average: number | null
}

const SUBJECTS = ['Matematika', 'Fizika', 'Hemija', 'Biologija', 'CSBH', 'Engleski jezik', 'Italijanski jezik', 'Istorija', 'Geografija', 'Informatika', 'Fizičko vaspitanje', 'Likovna umjetnost']
const SUBJECT_OFF = [-0.5, -0.4, -0.25, 0.1, 0.05, 0.35, 0.2, 0.15, 0.2, 0.5, 0.9, 0.7]
const TYPES = ['usmeni', 'pismeni', 'kontrolni', 'usmeni', 'domaći']

/** Deterministic pseudo-random from a string seed. */
function rng(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Invented but believable marks for the demo connection. */
export function makeDemoData(seed: string): { user: { name: string; class: string }; subjects: GoalSubject[]; absences: { date: string; hours: number; justified: boolean | null }[]; fetchedAt: string } {
  const r = rng(seed)
  const ability = 3.5 + (r() - 0.3) * 0.9
  const subjects: GoalSubject[] = SUBJECTS.map((name, i) => {
    const n = 3 + Math.floor(r() * 4)
    const grades: GoalGrade[] = []
    for (let k = 0; k < n; k++) {
      const v = Math.min(5, Math.max(1, Math.round(ability + SUBJECT_OFF[i] + (r() + r() - 1) * 1.3)))
      const day = 2 + Math.floor(r() * 13)
      grades.push({ grade: v, type: TYPES[Math.floor(r() * TYPES.length)], date: `${String(day).padStart(2, '0')}.09.2026.` })
    }
    grades.sort((a, b) => a.date.localeCompare(b.date))
    const average = grades.reduce((s, g) => s + g.grade, 0) / grades.length
    return { name, grades, finalGrade: Math.min(5, Math.max(1, Math.floor(average + 0.5))), average }
  })
  // A few absences this month: mostly justified, one or two not, one still pending.
  const absences = Array.from({ length: 2 + Math.floor(r() * 4) }, (_, i) => ({
    date: `${String(3 + Math.floor(r() * 12)).padStart(2, '0')}.09.2026.`,
    hours: 1 + Math.floor(r() * 4),
    justified: i === 0 ? null : r() < 0.7,
  }))
  return { user: { name: 'Demo učenik', class: '2-3' }, subjects, absences, fetchedAt: new Date().toISOString() }
}

function finalOf(s: GoalSubject): number | null {
  if (s.finalGrade) return s.finalGrade
  if (s.average === null) return null
  return Math.min(5, Math.max(1, Math.floor(s.average + 0.5)))
}

/** How many 5s (or 4s) it takes to lift a subject's average to `thr`. */
function liftPlan(s: GoalSubject, thr: number): string {
  const n = s.grades.length
  const sum = s.grades.reduce((a, g) => a + g.grade, 0)
  const need5 = Math.max(1, Math.ceil((thr * n - sum) / (5 - thr + 1e-9)))
  const need4 = thr < 4 ? Math.max(1, Math.ceil((thr * n - sum) / (4 - thr + 1e-9))) : null
  const five = need5 === 1 ? 'još jedna petica' : need5 === 2 ? 'još dvije petice' : need5 <= 4 ? `još ${need5} petice` : `još ${need5} petica`
  if (need4 !== null && need4 <= 2) return `${five} ili ${need4 === 1 ? 'jedna četvorka' : 'dvije četvorke'}`
  return five
}

export function GoalCard({ subjects }: { subjects: GoalSubject[] }) {
  const graded = subjects.filter((s) => s.average !== null && s.grades.length > 0)
  const finals = graded.map((s) => ({ s, f: finalOf(s)! }))
  const current = finals.length ? finals.reduce((a, x) => a + x.f, 0) / finals.length : null
  // Default target: the next quarter step above the current average (4,25 → 4,50).
  const [target, setTarget] = useState<number>(() => (current === null ? 4 : Math.min(5, Math.ceil((current + 0.05) * 4) / 4)))

  const plan = useMemo(() => {
    if (current === null || finals.length === 0) return null
    const n = finals.length
    const sum = finals.reduce((a, x) => a + x.f, 0)
    const deficit = Math.max(0, Math.ceil(target * n - sum - 1e-9))
    // Candidates: subjects below 5, easiest lift first (closest to the next x,50 threshold).
    const cands = finals
      .filter((x) => x.f < 5)
      .map((x) => ({ ...x, thr: x.f + 0.5, gap: x.f + 0.5 - (x.s.average ?? 0) }))
      .sort((a, b) => a.gap - b.gap)
    const picks = cands.slice(0, deficit)
    return { n, deficit, picks, reachable: deficit <= cands.length }
  }, [current, finals, target])

  const insights = useMemo(() => {
    const out: { icon: 'up' | 'down' | 'risk'; text: string }[] = []
    if (finals.length === 0) return out
    const best = [...finals].sort((a, b) => (b.s.average ?? 0) - (a.s.average ?? 0))[0]
    const worst = [...finals].sort((a, b) => (a.s.average ?? 0) - (b.s.average ?? 0))[0]
    out.push({ icon: 'up', text: `Najjači predmet: ${best.s.name} (${(best.s.average ?? 0).toFixed(2).replace('.', ',')}).` })
    if (worst.s.name !== best.s.name) out.push({ icon: 'down', text: `Najslabiji: ${worst.s.name} (${(worst.s.average ?? 0).toFixed(2).replace('.', ',')}) — tu je najviše prostora.` })
    const atRisk = finals.filter((x) => x.s.average !== null && x.s.average - (x.f - 0.5) < 0.2 && x.f > 1)
    for (const x of atRisk.slice(0, 2)) {
      out.push({ icon: 'risk', text: `${x.s.name}: prosjek ${(x.s.average ?? 0).toFixed(2).replace('.', ',')} je tik iznad ${x.f - 1},50 — jedna slaba ocjena spušta zaključnu na ${x.f - 1}.` })
    }
    return out
  }, [finals])

  if (current === null || !plan) return null

  return (
    <Card className="gap-4">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-full bg-[#FFF4C4] text-[#C79000] flex items-center justify-center flex-shrink-0"><Target className="w-5 h-5" strokeWidth={2.6} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] leading-[1.25] font-extrabold text-heading">Moj cilj</p>
          <p className="text-[13px] font-bold text-muted-foreground">Sada {current.toFixed(2).replace('.', ',')} po zaključnim ocjenama · {plan.n} predmeta</p>
        </div>
        <span className="text-[30px] leading-none font-black tabular-nums text-heading">{target.toFixed(2).replace('.', ',')}</span>
      </div>

      <input
        type="range"
        min={Math.max(2, Math.floor(current * 10) / 10)}
        max={5}
        step={0.1}
        value={target}
        onChange={(e) => { setTarget(Number(e.target.value)); haptic(5) }}
        aria-label="Ciljani prosjek"
        className="w-full h-11 accent-[#58CC02]"
      />
      <div className="flex justify-between text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground -mt-2">
        <span>sada</span><span>odličan 4,50</span><span>5,00</span>
      </div>

      {plan.deficit === 0 ? (
        <div className="rounded-xl border-2 border-[#B8F28B] bg-[#F1FBE8] px-3 py-2.5 text-[14px] font-extrabold text-heading">Već si na cilju. Drži ovaj nivo — pazi na predmete ispod.</div>
      ) : (
        <div className="space-y-2">
          <p className="text-[14px] font-extrabold text-heading">
            Treba {plan.deficit === 1 ? 'jedna zaključna ocjena više' : plan.deficit <= 4 ? `${plan.deficit} zaključne ocjene više` : `${plan.deficit} zaključnih ocjena više`}
            {plan.reachable ? ' — najlakše ovdje:' : ' — više nego što ima predmeta ispod 5, spusti cilj.'}
          </p>
          {plan.picks.map((p, i) => (
            <div key={p.s.name} className="flex items-center gap-3 min-h-12 rounded-xl border-2 border-border bg-background px-3 py-2">
              <span className="w-7 h-7 rounded-full bg-[#FFF4C4] text-[#C79000] text-[13px] font-extrabold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-extrabold text-heading truncate">{p.s.name} <span className="text-muted-foreground font-bold">{p.f} → {p.f + 1}</span></span>
                <span className="block text-[12px] font-bold text-muted-foreground">prosjek {(p.s.average ?? 0).toFixed(2).replace('.', ',')}, treba {p.thr.toFixed(1).replace('.', ',')} · {liftPlan(p.s, p.thr)}</span>
              </span>
              <Badge variant="gold">+{p.gap.toFixed(2).replace('.', ',')}</Badge>
            </div>
          ))}
        </div>
      )}

      {insights.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t-2 border-border">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground pt-2 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" strokeWidth={2.6} /> Zaključci</p>
          {insights.map((it, i) => (
            <p key={i} className="flex items-start gap-2 text-[13px] leading-[1.45] font-bold text-foreground">
              {it.icon === 'up' ? <TrendingUp className="w-4 h-4 text-[#58A700] flex-shrink-0 mt-0.5" strokeWidth={2.6} /> : it.icon === 'down' ? <TrendingDown className="w-4 h-4 text-[#FF4B4B] flex-shrink-0 mt-0.5" strokeWidth={2.6} /> : <Target className="w-4 h-4 text-[#C79000] flex-shrink-0 mt-0.5" strokeWidth={2.6} />}
              <span>{it.text}</span>
            </p>
          ))}
        </div>
      )}
    </Card>
  )
}
