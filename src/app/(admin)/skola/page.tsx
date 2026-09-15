'use client'

import Link from 'next/link'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/card'
import type { SubjectGrades } from '@/lib/skola-types'
import { Metric, SectionTitle } from '../nastavnik/_components/widgets'
import { fmtNum, fmtPct } from '../direktor/_lib/direktor-client'
import { SkolaPage, fmtDelta, fmtGrade, gradeColor } from './_lib/skola-client'

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec']

/** Five thin bars for the 1–5 distribution. */
function Dist({ dist }: { dist: SubjectGrades['dist'] }) {
  if (!dist) return null
  const max = Math.max(1, ...dist)
  const colors = ['#FF4B4B', '#FF9600', '#FFC800', '#8FE04A', '#58CC02']
  return (
    <div className="flex items-end gap-[3px] h-7 w-[64px] flex-shrink-0" aria-hidden="true">
      {dist.map((n, i) => (
        <span key={i} className="flex-1 rounded-[2px]" style={{ height: `${Math.max(8, (n / max) * 100)}%`, background: colors[i] }} />
      ))}
    </div>
  )
}

function BigGrade({ label, value, delta, hint }: { label: string; value: number | null; delta?: string | null; hint?: string }) {
  return (
    <Card className="gap-1 p-3.5 min-w-0">
      <span className="text-[13px] leading-[1.3] font-bold text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-2">
        <span className="text-[30px] leading-none font-extrabold tabular-nums" style={{ color: gradeColor(value) }}>{fmtGrade(value)}</span>
        {delta && <span className={`text-[13px] font-extrabold tabular-nums ${delta.startsWith('+') ? 'text-[#58A700]' : delta.startsWith('−') ? 'text-[#FF4B4B]' : 'text-muted-foreground'}`}>{delta}</span>}
      </span>
      {hint && <span className="text-[12px] font-bold text-muted-foreground">{hint}</span>}
    </Card>
  )
}

export default function SkolaOcjene() {
  return (
    <SkolaPage>
      {(s) => {
        const G = s.grades
        const monthly = G.monthly.map((m) => ({ m: MONTHS[Number(m.month.slice(5, 7)) - 1], avg: m.avg, n: m.n }))
        const distTotal = Math.max(1, G.dist.reduce((a, b) => a + b, 0))
        const worst = G.by_subject.filter((x) => !x.k_hidden).slice(0, 3)
        const best = [...G.by_subject].filter((x) => !x.k_hidden).reverse().slice(0, 3)
        const prevLabel = s.meta.period === '7d' || s.meta.period === '30d' ? 'vs prethodni period' : 'vs prošla godina'

        return (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <BigGrade label="Prosjek škole" value={G.avg} delta={fmtDelta(G.avg, G.prev_avg)} hint={prevLabel} />
              <Card className="gap-1 p-3.5 min-w-0">
                <span className="text-[13px] leading-[1.3] font-bold text-muted-foreground">Slabe ocjene (1 i 2)</span>
                <span className="text-[30px] leading-none font-extrabold tabular-nums" style={{ color: (G.low_share_pct ?? 0) > 15 ? '#FF4B4B' : (G.low_share_pct ?? 0) > 8 ? '#C79000' : '#3C3C3C' }}>{fmtPct(G.low_share_pct, 0)}</span>
                <span className="text-[12px] font-bold text-muted-foreground">od {fmtNum(G.n, 0)} ocjena</span>
              </Card>
            </div>

            <Card className="gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-muted-foreground">Raspodjela ocjena</span>
                <span className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{fmtNum(G.students, 0)} od {fmtNum(s.meta.verified_total, 0)} učenika</span>
              </div>
              <div className="flex h-5 rounded-full overflow-hidden bg-border">
                {G.dist.map((n, i) => (
                  <span key={i} style={{ width: `${(n / distTotal) * 100}%`, background: ['#FF4B4B', '#FF9600', '#FFC800', '#8FE04A', '#58CC02'][i] }} title={`${i + 1}: ${n}`} />
                ))}
              </div>
              <div className="flex justify-between text-[11px] font-extrabold text-muted-foreground tabular-nums">
                {G.dist.map((n, i) => (
                  <span key={i}><span style={{ color: ['#FF4B4B', '#FF9600', '#C79000', '#58A700', '#3E8A00'][i] }}>{i + 1}</span> · {fmtPct((n / distTotal) * 100, 0)}</span>
                ))}
              </div>
            </Card>

            <section className="space-y-2.5">
              <SectionTitle info="Prosječna ocjena po predmetu u periodu, od najslabijeg. Male trake: koliko je jedinica, dvojki … petica.">Po predmetima</SectionTitle>
              {G.by_subject.length === 0 ? (
                <Card><p className="text-[13px] font-bold text-muted-foreground">Nema ocjena u ovom periodu.</p></Card>
              ) : (
                <div className="space-y-2">
                  {G.by_subject.map((sub) => (
                    <Link key={sub.subject} href={`/skola/odjeljenja?subject=${encodeURIComponent(sub.subject)}`} className="flex items-center gap-3 min-h-14 rounded-2xl border-2 border-border bg-card px-3 py-2 shadow-[0_2px_0_var(--color-border)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none">
                      <span className="w-12 text-center text-[22px] leading-none font-extrabold tabular-nums flex-shrink-0" style={{ color: gradeColor(sub.avg) }}>{sub.k_hidden ? '·' : fmtGrade(sub.avg)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-extrabold text-heading truncate">{sub.subject}</span>
                        <span className="block text-[12px] font-bold text-muted-foreground">
                          {sub.k_hidden ? 'premalo učenika' : `${fmtNum(sub.n, 0)} ocjena · slabe ${fmtPct(sub.low_share_pct, 0)}`}
                          {fmtDelta(sub.avg, sub.prev_avg) && <span className={fmtDelta(sub.avg, sub.prev_avg)!.startsWith('+') ? 'text-[#58A700]' : fmtDelta(sub.avg, sub.prev_avg)!.startsWith('−') ? 'text-[#FF4B4B]' : ''}> · {fmtDelta(sub.avg, sub.prev_avg)}</span>}
                        </span>
                      </span>
                      <Dist dist={sub.dist} />
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Prosjek po razredu. Pokrivenost = koliko učenika sa spiska ima bar jednu ocjenu u periodu.">Po razredima</SectionTitle>
              <div className="grid grid-cols-2 gap-2.5">
                {G.by_class.map((c) => (
                  <Link key={c.class_number} href={`/skola/odjeljenja?class=${c.class_number}`} className="block">
                    <Card className="gap-1 p-3.5 transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none">
                      <span className="text-[13px] font-bold text-muted-foreground">{c.class_number}. razred</span>
                      <span className="flex items-baseline gap-2">
                        <span className="text-[26px] leading-none font-extrabold tabular-nums" style={{ color: gradeColor(c.avg) }}>{fmtGrade(c.avg)}</span>
                        {fmtDelta(c.avg, c.prev_avg) && <span className="text-[12px] font-extrabold text-muted-foreground tabular-nums">{fmtDelta(c.avg, c.prev_avg)}</span>}
                      </span>
                      <span className="text-[12px] font-bold text-muted-foreground">{c.students}/{c.roster} učenika · {fmtPct(c.coverage_pct, 0)}</span>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Prosječna ocjena po mjesecima u zadnjih 12 mjeseci (ljeto prazno).">Kretanje kroz godinu</SectionTitle>
              <Card>
                <div className="h-[170px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <XAxis dataKey="m" tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[2, 5]} ticks={[2, 3, 4, 5]} tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => [fmtGrade(Number(v)), 'Prosjek']} />
                      <Line type="monotone" dataKey="avg" stroke="#58CC02" strokeWidth={3} dot={{ r: 3, strokeWidth: 0, fill: '#58CC02' }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-[70px] -mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthly} margin={{ top: 0, right: 8, left: -18, bottom: 0 }}>
                      <XAxis dataKey="m" hide />
                      <YAxis hide />
                      <Tooltip formatter={(v) => [fmtNum(Number(v), 0), 'Ocjena']} />
                      <Bar dataKey="n" fill="#DDF4FF" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">gore prosjek · dolje broj ocjena</p>
              </Card>
            </section>

            {(worst.length > 0 || best.length > 0) && (
              <Card className="gap-3">
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <Metric label="Najslabije" value={worst.map((w) => w.subject).join(', ') || '—'} tone="bad" />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <Metric label="Najbolje" value={best.map((w) => w.subject).join(', ') || '—'} tone="good" />
                </div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Grupe ispod {s.meta.k_min} učenika su sakrivene (zaštita privatnosti)</p>
              </Card>
            )}
          </>
        )
      }}
    </SkolaPage>
  )
}
