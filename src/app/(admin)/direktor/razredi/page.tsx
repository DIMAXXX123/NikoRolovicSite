'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ChevronRight, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { ClassCell } from '@/lib/direktor-types'
import { Chip, EmptyState, Metric, ProgressBar, SectionTitle } from '../../nastavnik/_components/widgets'
import { K_HIDDEN_TEXT, fmtNum, fmtPct, scoreColor } from '../_lib/direktor-client'
import { StatsPage } from '../_components/blocks'

type Sort = 'rank' | 'activity' | 'score'

function cellTone(c: ClassCell): string {
  if (c.k_hidden || c.composite === null) return '#F7F7F7'
  if (c.composite >= 70) return '#E6FAD2'
  if (c.composite >= 45) return '#FFF9E0'
  return '#FFE5E5'
}

export default function DirektorRazredi() {
  const [sort, setSort] = useState<Sort>('rank')
  return (
    <StatsPage>
      {(s) => {
        const C = s.classes
        const matrix = [...C.matrix].sort((a, b) => {
          if (sort === 'activity') return (b.active_7d_pct ?? -1) - (a.active_7d_pct ?? -1)
          if (sort === 'score') return (b.avg_score ?? -1) - (a.avg_score ?? -1)
          return (a.rank ?? 99) - (b.rank ?? 99)
        })
        const classNumbers = Array.from(new Set(C.matrix.map((c) => c.class_number))).sort((a, b) => a - b)
        const maxSections = Math.max(1, ...C.matrix.map((c) => c.section_number))
        const byKey = new Map(C.matrix.map((c) => [`${c.class_number}-${c.section_number}`, c]))

        return (
          <>
            <Card className="gap-3 border-[#FFB3B5] bg-[#FFF3F3] shadow-[0_2px_0_#FFB3B5]">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-full bg-[#FFE0E0] text-[#D12F2F] flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5" strokeWidth={2.6} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[20px] leading-[1.2] font-extrabold text-heading tabular-nums">{fmtNum(C.at_risk.count, 0)} učenika u riziku</p>
                  <p className="text-[13px] font-bold text-muted-foreground">{C.at_risk.churned > 0 ? `+ ${C.at_risk.churned} bez aktivnosti duže od 60 dana` : 'Niko nije tih duže od 60 dana'}</p>
                </div>
              </div>
              {C.at_risk.by_section.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {C.at_risk.by_section.slice(0, 8).map((b) => (
                    <Link key={`${b.class_number}-${b.section_number}`} href={b.class_number && b.section_number ? `/direktor/razredi/${b.class_number}-${b.section_number}` : '/direktor/razredi'}>
                      <Badge variant="destructive">{b.class_number ?? '?'}-{b.section_number ?? '?'} · {b.count}</Badge>
                    </Link>
                  ))}
                </div>
              )}
              <p className="text-[12px] font-bold text-muted-foreground">Imena se vide samo na stranici odjeljenja.</p>
            </Card>

            <section className="space-y-2.5">
              <SectionTitle info="Boja ćelije = ukupna ocjena odjeljenja: 40 % aktivnost, 40 % prosjek kviza, 20 % pročitano po učeniku. Dodirni odjeljenje za detalje.">Mapa odjeljenja</SectionTitle>
              <Card className="gap-2 p-3">
                <div className="grid gap-1.5" style={{ gridTemplateColumns: `36px repeat(${maxSections}, minmax(0, 1fr))` }}>
                  <span />
                  {Array.from({ length: maxSections }, (_, i) => (
                    <span key={i} className="text-center text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{i + 1}</span>
                  ))}
                  {classNumbers.map((cn) => (
                    <div key={cn} className="contents">
                      <span className="flex items-center text-[13px] font-extrabold text-heading">{cn}.</span>
                      {Array.from({ length: maxSections }, (_, i) => {
                        const c = byKey.get(`${cn}-${i + 1}`)
                        if (!c) return <span key={i} className="aspect-square rounded-xl bg-transparent" />
                        return (
                          <Link key={i} href={`/direktor/razredi/${cn}-${i + 1}`} className="aspect-square rounded-xl border-2 border-border flex flex-col items-center justify-center gap-0.5 transition-transform duration-[80ms] active:scale-95" style={{ background: cellTone(c) }}>
                            <span className="text-[15px] leading-none font-extrabold text-heading tabular-nums">{c.k_hidden ? '·' : c.composite === null ? '—' : Math.round(c.composite)}</span>
                            <span className="text-[10px] leading-none font-bold text-muted-foreground tabular-nums">{c.k_hidden ? 'k' : fmtPct(c.active_7d_pct, 0)}</span>
                          </Link>
                        )
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded-[3px] bg-[#E6FAD2] border border-border" /> dobro</span>
                  <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded-[3px] bg-[#FFF9E0] border border-border" /> pažnja</span>
                  <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded-[3px] bg-[#FFE5E5] border border-border" /> problem</span>
                  <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded-[3px] bg-[#F7F7F7] border border-border" /> k = premalo</span>
                </div>
              </Card>
            </section>

            <section className="space-y-2.5">
              <SectionTitle>Po razredima</SectionTitle>
              <div className="space-y-2.5">
                {C.by_class.map((c) => (
                  <Card key={c.class_number} className="gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[20px] leading-[1.25] font-extrabold text-heading">{c.class_number}. razred</span>
                      <span className="text-[13px] font-bold text-muted-foreground">{c.sections} odj. · {c.registered}/{c.students_total} učenika</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[13px] font-bold text-muted-foreground mb-1.5">
                        <span>Aktivno 7 dana</span>
                        <span className="text-heading">{fmtPct(c.active_7d_pct, 0)}</span>
                      </div>
                      <ProgressBar pct={c.active_7d_pct} color="#1CB0F6" />
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      <Metric label="Aktivno 30 d" value={c.active_30d === null ? '—' : fmtNum(c.active_30d, 0)} />
                      <Metric label="Lekcija / učenik" value={fmtNum(c.lectures_read_per_student, 1)} />
                      <Metric label="Kviz / učenik" value={fmtNum(c.quizzes_per_student, 1)} />
                      <Metric label="Prosjek" value={fmtPct(c.avg_score, 0)} tone={(c.avg_score ?? 100) < 50 ? 'bad' : (c.avg_score ?? 0) >= 75 ? 'good' : 'muted'} />
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            <section className="space-y-2.5">
              <SectionTitle>Sva odjeljenja</SectionTitle>
              <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {([['rank', 'Rang'], ['activity', 'Aktivnost'], ['score', 'Prosjek']] as const).map(([k, l]) => (
                  <Chip key={k} active={sort === k} onClick={() => setSort(k)} className="flex-shrink-0">{l}</Chip>
                ))}
              </div>
              {matrix.length === 0 ? (
                <EmptyState icon={Users} title="Nema odjeljenja" text="Odjeljenja se pojave kad učenici počnu da koriste aplikaciju." />
              ) : (
                <div className="space-y-2">
                  {matrix.map((c) => (
                    <Link key={`${c.class_number}-${c.section_number}`} href={`/direktor/razredi/${c.class_number}-${c.section_number}`} className="flex items-center gap-3 min-h-16 rounded-2xl border-2 border-border bg-card px-3 py-2 shadow-[0_2px_0_var(--color-border)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none">
                      <span className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-[15px] font-extrabold tabular-nums" style={{ background: cellTone(c), color: '#3C3C3C' }}>{c.rank ?? '—'}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[16px] font-extrabold text-heading">{c.class_number}-{c.section_number}</span>
                          {c.rank_delta !== null && c.rank_delta !== 0 && (
                            <Badge variant={c.rank_delta > 0 ? 'secondary' : 'destructive'}>{c.rank_delta > 0 ? '▲' : '▼'} {Math.abs(c.rank_delta)}</Badge>
                          )}
                          {c.k_hidden && <Badge variant="outline">k</Badge>}
                        </span>
                        <span className="block text-[13px] font-bold text-muted-foreground truncate">
                          {c.k_hidden ? K_HIDDEN_TEXT : `${fmtPct(c.active_7d_pct, 0)} aktivno · prosjek ${fmtPct(c.avg_score, 0)} · ${c.registered}/${c.students_total}`}
                        </span>
                      </span>
                      {!c.k_hidden && c.trend_7d_pct !== null && (
                        <span className="text-[13px] font-extrabold tabular-nums" style={{ color: c.trend_7d_pct < 0 ? '#FF4B4B' : c.trend_7d_pct > 0 ? '#58A700' : '#777' }}>{c.trend_7d_pct > 0 ? '+' : ''}{fmtNum(c.trend_7d_pct, 0)}%</span>
                      )}
                      {!c.k_hidden && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: scoreColor(c.avg_score) }} />}
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" strokeWidth={2.6} />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )
      }}
    </StatsPage>
  )
}
