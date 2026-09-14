'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft, Eye, EyeOff, UserRound } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { DirektorStudents } from '@/lib/direktor-types'
import { EmptyState, Metric, ProgressBar, RowSkeletons, SectionTitle } from '../../../nastavnik/_components/widgets'
import { K_HIDDEN_TEXT, fmtDate, fmtNum, fmtPct, scoreColor, useApi } from '../../_lib/direktor-client'
import { StatsPage } from '../../_components/blocks'

function parseCls(raw: string): { cls: number; section: number } | null {
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(decodeURIComponent(raw))
  if (!m) return null
  return { cls: Number(m[1]), section: Number(m[2]) }
}

/** Names of at-risk pupils — loaded only after an explicit tap (audited on the server). */
function AtRiskNames({ cls, section }: { cls: number; section: number }) {
  const [open, setOpen] = useState(false)
  const { data, error, loading } = useApi<DirektorStudents>(open ? `/api/direktor/students?class=${cls}&section=${section}` : null)
  if (!open) {
    return (
      <Button variant="outline" className="w-full h-14" onClick={() => setOpen(true)}>
        <Eye className="w-5 h-5" strokeWidth={2.6} /> Prikaži imena učenika u riziku
      </Button>
    )
  }
  if (error) return <p className="text-[13px] font-bold text-destructive">{error.message}</p>
  if (loading || !data) return <RowSkeletons n={3} />
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Pregled je zabilježen u dnevniku</p>
        <button type="button" onClick={() => setOpen(false)} className="inline-flex items-center gap-1 min-h-11 text-[12px] font-extrabold uppercase tracking-[0.04em] text-secondary"><EyeOff className="w-4 h-4" strokeWidth={2.6} /> Sakrij</button>
      </div>
      {data.at_risk.length === 0 ? (
        <p className="text-[13px] font-bold text-muted-foreground">Nema učenika u riziku u ovom odjeljenju.</p>
      ) : (
        data.at_risk.map((p) => (
          <div key={p.name} className="flex items-center gap-3 min-h-14 rounded-2xl border-2 border-[#FFB3B5] bg-[#FFF3F3] px-3 py-2 shadow-[0_2px_0_#FFB3B5]">
            <span className="w-10 h-10 rounded-full bg-[#FFE0E0] text-[#D12F2F] flex items-center justify-center flex-shrink-0"><UserRound className="w-5 h-5" strokeWidth={2.6} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-extrabold text-heading truncate">{p.name}{p.source === 'roster' && <span className="text-muted-foreground font-bold"> · nije registrovan</span>}</span>
              <span className="flex flex-wrap gap-1 mt-1">
                {p.reasons.map((r) => <Badge key={r} variant="destructive">{r}</Badge>)}
              </span>
            </span>
            <span className="text-[12px] font-bold text-muted-foreground text-right flex-shrink-0">{p.last_active ? fmtDate(p.last_active) : '—'}</span>
          </div>
        ))
      )}
    </div>
  )
}

export default function DirektorOdjeljenje() {
  const { cls: raw } = useParams<{ cls: string }>()
  const parsed = parseCls(raw)
  if (!parsed) {
    return <EmptyState title="Nepoznato odjeljenje" text="Adresa treba da izgleda kao /direktor/razredi/3-2." action={<Link href="/direktor/razredi"><Button>Nazad na razrede</Button></Link>} />
  }
  const { cls, section } = parsed

  return (
    <div className="space-y-4">
      <Link href="/direktor/razredi" className="inline-flex items-center gap-1 h-11 text-[13px] font-extrabold uppercase tracking-[0.04em] text-secondary">
        <ChevronLeft className="w-5 h-5" strokeWidth={2.6} /> Sva odjeljenja
      </Link>
      <h2 className="text-[26px] leading-[1.2] font-extrabold tracking-[-0.01em] text-heading">Odjeljenje {cls}-{section}</h2>
      <StatsPage filters={{ class: cls, section }}>
        {(s) => {
          const d = s.class_detail
          if (!d) return <EmptyState title="Nema podataka" text="Za ovo odjeljenje još nema zabilježene aktivnosti." />
          const k = d.kpi
          // class_detail.kpi is the raw cstats row: no active_7d_pct column, and
          // registered (event-derived) can exceed the roster count in seeded data.
          const registered = k ? Math.min(k.registered, k.students_total) : 0
          const active7Pct = k ? (k.active_7d_pct ?? (k.active_7d !== null && registered > 0 ? Math.min(100, (k.active_7d / registered) * 100) : null)) : null
          const activity = d.activity.map((p) => ({ date: p.date.slice(5), odj: p.section_dau, skola: p.school_dau }))
          const subjects = [...d.subjects].sort((a, b) => (a.avg_score ?? 101) - (b.avg_score ?? 101))
          return (
            <>
              <Card className="gap-3">
                {!k || k.k_hidden ? (
                  <p className="text-[13px] font-bold text-muted-foreground">{K_HIDDEN_TEXT}</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-bold text-muted-foreground">{registered} od {k.students_total} učenika registrovano</span>
                      {k.trend_7d_pct !== null && <Badge variant={k.trend_7d_pct < 0 ? 'destructive' : 'secondary'}>{k.trend_7d_pct > 0 ? '+' : ''}{fmtNum(k.trend_7d_pct, 0)}% vs prošla sedmica</Badge>}
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[13px] font-bold text-muted-foreground mb-1.5">
                        <span>Aktivno 7 dana</span>
                        <span className="text-heading">{fmtPct(active7Pct, 0)}</span>
                      </div>
                      <ProgressBar pct={active7Pct} color="#1CB0F6" />
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      <Metric label="Aktivno 7 d" value={k.active_7d === null ? '—' : fmtNum(k.active_7d, 0)} />
                      <Metric label="Aktivno 30 d" value={k.active_30d === null ? '—' : fmtNum(k.active_30d, 0)} />
                      <Metric label="Lekcija / učenik" value={fmtNum(k.lectures_read_per_student, 1)} />
                      <Metric label="Kviz / učenik" value={fmtNum(k.quizzes_per_student, 1)} />
                      <Metric label="Prosjek" value={fmtPct(k.avg_score, 0)} tone={(k.avg_score ?? 100) < 50 ? 'bad' : (k.avg_score ?? 0) >= 75 ? 'good' : 'muted'} />
                    </div>
                  </>
                )}
              </Card>

              <section className="space-y-2.5">
                <SectionTitle info="Prosječan rezultat kviza po predmetu, u poređenju sa prosjekom cijele škole.">Predmeti</SectionTitle>
                {subjects.length === 0 ? (
                  <Card><p className="text-[13px] font-bold text-muted-foreground">Još nema završenih kvizova.</p></Card>
                ) : (
                  <Card className="gap-3">
                    {subjects.map((sub) => (
                      <Link key={sub.subject} href={`/direktor/ucenje/${encodeURIComponent(sub.subject)}`} className="block min-h-11">
                        <div className="flex items-center justify-between gap-2 text-[13px] font-extrabold">
                          <span className="truncate text-heading">{sub.subject}<span className="text-muted-foreground font-bold"> · {sub.quiz_finishes ?? 0} kvizova</span></span>
                          <span className="tabular-nums text-heading">{fmtPct(sub.avg_score, 0)}<span className="text-muted-foreground font-bold"> / škola {fmtPct(sub.school_avg_score, 0)}</span></span>
                        </div>
                        <div className="relative h-3 rounded-full bg-border overflow-hidden mt-1">
                          <div className="h-full rounded-full" style={{ width: `${sub.avg_score ?? 0}%`, background: scoreColor(sub.avg_score) }} />
                          {sub.school_avg_score !== null && <span className="absolute top-0 bottom-0 w-[3px] bg-heading/60" style={{ left: `${sub.school_avg_score}%` }} />}
                        </div>
                      </Link>
                    ))}
                  </Card>
                )}
              </section>

              <section className="space-y-2.5">
                <SectionTitle info="Dnevno aktivni učenici u odjeljenju (plavo) i u cijeloj školi (sivo).">Aktivnost</SectionTitle>
                <Card>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activity} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                        <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} minTickGap={24} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="skola" name="Škola" stroke="#CECECE" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="odj" name="Odjeljenje" stroke="#1CB0F6" strokeWidth={3} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </section>

              <section className="space-y-2.5">
                <SectionTitle info="Učenici neaktivni 14+ dana, sa padom rezultata ili napuštenim kvizovima. Imena se učitavaju tek na dodir i pregled se bilježi.">U riziku · {d.at_risk_count}</SectionTitle>
                <AtRiskNames cls={cls} section={section} />
              </section>
            </>
          )
        }}
      </StatsPage>
    </div>
  )
}
