'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronRight, DoorOpen, Trophy, Users } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Chip, EmptyState, Metric, SectionTitle } from '../../nastavnik/_components/widgets'
import { fmtNum, fmtPct } from '../../direktor/_lib/direktor-client'
import { SkolaPage, fmtDelta, fmtGrade, gradeColor } from '../_lib/skola-client'

type Sort = 'rank' | 'grades' | 'absences'

function scoreTone(v: number | null): string {
  if (v === null) return '#F7F7F7'
  if (v >= 70) return '#E6FAD2'
  if (v >= 50) return '#FFF9E0'
  return '#FFE5E5'
}

function OdjeljenjaInner() {
  const sp = useSearchParams()
  const subject = sp.get('subject')
  const cls = Number(sp.get('class')) || null
  const [sort, setSort] = useState<Sort>('rank')
  const [onlyClass, setOnlyClass] = useState<number | null>(cls)

  return (
    <SkolaPage filters={{ subject, class: onlyClass }}>
      {(s) => {
        const A = s.attendance
        const att = new Map(A.by_section.map((a) => [`${a.class_number}-${a.section_number}`, a]))
        const rows = [...s.ranking].sort((x, y) => {
          if (sort === 'grades') return (y.grade_avg ?? -1) - (x.grade_avg ?? -1)
          if (sort === 'absences') return (y.absences_per_student ?? -1) - (x.absences_per_student ?? -1)
          return (x.rank || 99) - (y.rank || 99)
        })
        const weekly = A.weekly.slice(-16).map((w) => ({ w: w.week_start.slice(5), opravdano: w.hours - w.unjustified, neopravdano: w.unjustified }))
        const attSorted = [...A.by_section].sort((a, b) => (b.unjustified_pct ?? -1) - (a.unjustified_pct ?? -1)).slice(0, 5)
        const prevAtt = A.prev_hours > 0 ? Math.round(((A.hours - A.prev_hours) / A.prev_hours) * 100) : null

        return (
          <>
            {subject && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{subject}</Badge>
                <Link href="/skola/odjeljenja" className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-secondary min-h-11 inline-flex items-center">svi predmeti</Link>
              </div>
            )}

            <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Chip active={onlyClass === null} onClick={() => setOnlyClass(null)} className="flex-shrink-0">Svi razredi</Chip>
              {[1, 2, 3, 4].map((c) => (
                <Chip key={c} active={onlyClass === c} onClick={() => setOnlyClass(c)} className="flex-shrink-0">{c}. razred</Chip>
              ))}
            </div>

            <section className="space-y-2.5">
              <SectionTitle
                info="Ocjena odjeljenja 0–100: 50 % prosjek ocjena, 25 % izostanci (manje neopravdanih = bolje), 25 % rezultat kvizova. Zeleno ≥ 70, žuto ≥ 50, crveno ispod."
              >
                Rang odjeljenja
              </SectionTitle>
              <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {([['rank', 'Ukupno'], ['grades', 'Ocjene'], ['absences', 'Izostanci']] as const).map(([k, l]) => (
                  <Chip key={k} active={sort === k} onClick={() => setSort(k)} className="flex-shrink-0">{l}</Chip>
                ))}
              </div>
              {rows.length === 0 ? (
                <EmptyState icon={Users} title="Nema podataka" text="Nema ocjena za ova odjeljenja u periodu." />
              ) : (
                <div className="space-y-2">
                  {rows.map((r) => {
                    const a = att.get(`${r.class_number}-${r.section_number}`)
                    const delta = fmtDelta(r.grade_avg, r.prev_grade_avg)
                    return (
                      <Link key={`${r.class_number}-${r.section_number}`} href={`/skola/odjeljenja/${r.class_number}-${r.section_number}`} className="flex items-center gap-3 min-h-16 rounded-2xl border-2 border-border bg-card px-3 py-2 shadow-[0_2px_0_var(--color-border)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none">
                        <span className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-[15px] font-extrabold tabular-nums text-heading" style={{ background: scoreTone(r.score) }}>{r.rank || '—'}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-[16px] font-extrabold text-heading">{r.class_number}-{r.section_number}</span>
                            {r.rank === 1 && <Trophy className="w-4 h-4 text-[#C79000]" strokeWidth={2.6} />}
                            {r.k_hidden && <Badge variant="outline">premalo</Badge>}
                          </span>
                          <span className="block text-[12px] font-bold text-muted-foreground truncate">
                            {r.k_hidden ? 'grupa ispod k-praga' : <><b style={{ color: gradeColor(r.grade_avg) }}>{fmtGrade(r.grade_avg)}</b>{delta ? ` ${delta}` : ''} · neopr. {fmtPct(r.unjustified_pct, 0)} · kviz {fmtPct(r.quiz_avg, 0)}</>}
                          </span>
                        </span>
                        <span className="text-right flex-shrink-0">
                          <span className="block text-[18px] leading-none font-extrabold tabular-nums text-heading">{r.score ?? '—'}</span>
                          <span className="block text-[10px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground mt-1">{a ? `${fmtNum(a.per_student, 1)} h/uč.` : 'bez izost.'}</span>
                        </span>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" strokeWidth={2.6} />
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Sati izostanaka u periodu: ukupno, neopravdani, po učeniku. Izvor: eDnevnik učenika ili ručni unos.">Izostanci</SectionTitle>
              <Card className="gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-[#FFF3E0] text-[#C96A00] flex items-center justify-center flex-shrink-0"><DoorOpen className="w-5 h-5" strokeWidth={2.6} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[20px] leading-[1.2] font-extrabold text-heading tabular-nums">{fmtNum(A.hours, 0)} sati{prevAtt !== null && <span className={`text-[13px] ml-2 ${prevAtt > 0 ? 'text-[#FF4B4B]' : 'text-[#58A700]'}`}>{prevAtt > 0 ? '+' : ''}{prevAtt}%</span>}</p>
                    <p className="text-[13px] font-bold text-muted-foreground">{fmtNum(A.unjustified, 0)} neopravdanih · {fmtNum(A.per_student, 1)} h po učeniku · {fmtNum(A.students_absent, 0)} učenika izostajalo</p>
                  </div>
                </div>
                {A.heavy_unjustified > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border-2 border-[#FFB3B5] bg-[#FFF3F3] px-3 py-2 text-[13px] font-extrabold text-heading">
                    <Badge variant="destructive">{A.heavy_unjustified}</Badge> učenika sa 10+ neopravdanih sati
                  </div>
                )}
                {weekly.length > 1 && (
                  <div className="h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weekly} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                        <XAxis dataKey="w" tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} minTickGap={20} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="opravdano" name="Opravdano" stackId="a" fill="#84D8FF" isAnimationActive={false} />
                        <Bar dataKey="neopravdano" name="Neopravdano" stackId="a" fill="#FF4B4B" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {attSorted.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Najviše neopravdanih</p>
                    {attSorted.map((a) => (
                      <Link key={`${a.class_number}-${a.section_number}`} href={`/skola/odjeljenja/${a.class_number}-${a.section_number}`} className="flex items-center gap-2 min-h-10 text-[13px] font-bold">
                        <span className="w-10 font-extrabold text-heading">{a.class_number}-{a.section_number}</span>
                        <div className="flex-1 h-3 rounded-full bg-border overflow-hidden"><div className="h-full rounded-full bg-[#FF4B4B]" style={{ width: `${Math.min(100, a.unjustified_pct ?? 0)}%` }} /></div>
                        <span className="w-24 text-right tabular-nums text-heading">{fmtPct(a.unjustified_pct, 0)} · {fmtNum(a.hours, 0)} h</span>
                      </Link>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {A.by_class.map((c) => (
                    <Metric key={c.class_number} label={`${c.class_number}. razred`} value={`${fmtNum(c.per_student, 1)} h/uč.`} tone={(c.per_student ?? 0) > 3 ? 'bad' : 'muted'} />
                  ))}
                </div>
              </Card>
            </section>
          </>
        )
      }}
    </SkolaPage>
  )
}

export default function SkolaOdjeljenja() {
  return (
    <Suspense fallback={null}>
      <OdjeljenjaInner />
    </Suspense>
  )
}
