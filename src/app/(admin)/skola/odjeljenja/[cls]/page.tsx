'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState, Metric, SectionTitle } from '../../../nastavnik/_components/widgets'
import { fmtDate, fmtNum, fmtPct } from '../../../direktor/_lib/direktor-client'
import { SkolaPage, fmtDelta, fmtGrade, gradeColor } from '../../_lib/skola-client'

const KIND_LABEL = { pohvala: 'Pohvala', opomena: 'Opomena', napomena: 'Napomena' } as const
const KIND_VARIANT = { pohvala: 'secondary', opomena: 'destructive', napomena: 'gold' } as const

function parseCls(raw: string): { cls: number; section: number } | null {
  const m = /^(\d)-(\d)$/.exec(decodeURIComponent(raw))
  return m ? { cls: Number(m[1]), section: Number(m[2]) } : null
}

export default function SkolaOdjeljenje() {
  const { cls: raw } = useParams<{ cls: string }>()
  const parsed = parseCls(raw)
  if (!parsed) {
    return <EmptyState title="Nepoznato odjeljenje" text="Adresa treba da izgleda kao /skola/odjeljenja/3-2." action={<Link href="/skola/odjeljenja"><Button>Nazad</Button></Link>} />
  }
  const { cls, section } = parsed

  return (
    <div className="space-y-4">
      <Link href="/skola/odjeljenja" className="inline-flex items-center gap-1 h-11 text-[13px] font-extrabold uppercase tracking-[0.04em] text-secondary">
        <ChevronLeft className="w-5 h-5" strokeWidth={2.6} /> Sva odjeljenja
      </Link>
      <h2 className="text-[26px] leading-[1.2] font-extrabold tracking-[-0.01em] text-heading">Odjeljenje {cls}-{section}</h2>
      <SkolaPage filters={{ class: cls, section }}>
        {(s) => {
          const g = s.grades.by_section[0]
          const a = s.attendance.by_section[0]
          const d = s.section_detail
          const rank = s.ranking[0]
          const daily = (d?.absences_daily ?? []).slice(-30).map((x) => ({ d: x.date.slice(5), opravdano: x.hours - x.unjustified, neopravdano: x.unjustified }))
          const delta = g ? fmtDelta(g.avg, g.prev_avg) : null

          return (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <Card className="gap-1 p-3.5">
                  <span className="text-[13px] font-bold text-muted-foreground">Prosjek ocjena</span>
                  <span className="flex items-baseline gap-2">
                    <span className="text-[30px] leading-none font-extrabold tabular-nums" style={{ color: gradeColor(g?.avg) }}>{g?.k_hidden ? '·' : fmtGrade(g?.avg)}</span>
                    {delta && <span className={`text-[13px] font-extrabold tabular-nums ${delta.startsWith('+') ? 'text-[#58A700]' : delta.startsWith('−') ? 'text-[#FF4B4B]' : 'text-muted-foreground'}`}>{delta}</span>}
                  </span>
                  <span className="text-[12px] font-bold text-muted-foreground">{g ? `${g.students}/${g.roster} učenika · ${fmtNum(g.n, 0)} ocjena` : 'nema ocjena'}</span>
                </Card>
                <Card className="gap-1 p-3.5">
                  <span className="text-[13px] font-bold text-muted-foreground">Izostanci</span>
                  <span className="text-[30px] leading-none font-extrabold tabular-nums text-heading">{a ? fmtNum(a.hours, 0) : '0'}<span className="text-[14px] text-muted-foreground"> h</span></span>
                  <span className="text-[12px] font-bold text-muted-foreground">{a ? `${fmtNum(a.unjustified, 0)} neopravdano · ${fmtNum(a.per_student, 1)} h/uč.` : 'bez izostanaka'}</span>
                </Card>
              </div>

              {rank && (
                <Card className="flex-row items-center gap-3">
                  <span className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-[17px] font-extrabold tabular-nums text-heading" style={{ background: rank.score === null ? '#F7F7F7' : rank.score >= 70 ? '#E6FAD2' : rank.score >= 50 ? '#FFF9E0' : '#FFE5E5' }}>{rank.score ?? '—'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-extrabold text-heading">Ukupna ocjena odjeljenja</p>
                    <p className="text-[12px] font-bold text-muted-foreground">50 % ocjene · 25 % izostanci · 25 % kvizovi ({fmtPct(rank.quiz_avg, 0)})</p>
                  </div>
                  {g && g.low_share_pct !== null && <Badge variant={g.low_share_pct > 15 ? 'destructive' : 'outline'}>slabe {fmtPct(g.low_share_pct, 0)}</Badge>}
                </Card>
              )}

              <section className="space-y-2.5">
                <SectionTitle info="Prosjek odjeljenja po predmetu (traka) i prosjek škole (crtica). Od najslabijeg.">Predmeti</SectionTitle>
                {!d || d.subjects.length === 0 ? (
                  <Card><p className="text-[13px] font-bold text-muted-foreground">Nema ocjena u periodu.</p></Card>
                ) : (
                  <Card className="gap-3">
                    {d.subjects.map((sub) => (
                      <div key={sub.subject} className="min-h-11">
                        <div className="flex items-center justify-between gap-2 text-[13px] font-extrabold">
                          <span className="truncate text-heading">{sub.subject}<span className="text-muted-foreground font-bold"> · {sub.n ?? 0} ocj.</span></span>
                          <span className="tabular-nums" style={{ color: gradeColor(sub.avg) }}>{sub.k_hidden ? 'premalo' : fmtGrade(sub.avg)}<span className="text-muted-foreground font-bold"> / škola {fmtGrade(sub.school_avg)}</span></span>
                        </div>
                        <div className="relative h-3 rounded-full bg-border overflow-hidden mt-1">
                          <div className="h-full rounded-full" style={{ width: `${((sub.avg ?? 1) - 1) / 4 * 100}%`, background: gradeColor(sub.avg) }} />
                          {sub.school_avg !== null && <span className="absolute top-0 bottom-0 w-[3px] bg-heading/60" style={{ left: `${((sub.school_avg - 1) / 4) * 100}%` }} />}
                        </div>
                      </div>
                    ))}
                  </Card>
                )}
              </section>

              <section className="space-y-2.5">
                <SectionTitle info="Sati izostanaka po danu u zadnjih 30 školskih dana sa podacima.">Izostanci po danima</SectionTitle>
                <Card>
                  {daily.length === 0 ? (
                    <p className="text-[13px] font-bold text-muted-foreground">Nema izostanaka u periodu.</p>
                  ) : (
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={daily} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                          <XAxis dataKey="d" tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} minTickGap={20} />
                          <YAxis tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="opravdano" name="Opravdano" stackId="a" fill="#84D8FF" isAnimationActive={false} />
                          <Bar dataKey="neopravdano" name="Neopravdano" stackId="a" fill="#FF4B4B" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {a && (
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      <Metric label="Učenika izostajalo" value={fmtNum(a.students_absent, 0)} />
                      <Metric label="Neopravdano" value={fmtPct(a.unjustified_pct, 0)} tone={(a.unjustified_pct ?? 0) > 30 ? 'bad' : 'muted'} />
                      <Metric label="Prošli period" value={`${fmtNum(a.prev_hours, 0)} h`} />
                    </div>
                  )}
                </Card>
              </section>

              <section className="space-y-2.5">
                <SectionTitle action={<Link href={`/skola/ponasanje?class=${cls}&section=${section}`} className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-secondary min-h-11 inline-flex items-center">Dodaj</Link>}>Ponašanje · {s.notes.total}</SectionTitle>
                {s.notes.latest.length === 0 ? (
                  <Card><p className="text-[13px] font-bold text-muted-foreground">Nema zabilješki u periodu.</p></Card>
                ) : (
                  <div className="space-y-2">
                    {s.notes.latest.slice(0, 8).map((n) => (
                      <Card key={n.id} size="sm" className="gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={KIND_VARIANT[n.kind]}>{KIND_LABEL[n.kind]}</Badge>
                          {n.student_name && <span className="text-[13px] font-extrabold text-heading">{n.student_name}</span>}
                          <span className="text-[12px] font-bold text-muted-foreground ml-auto">{fmtDate(n.created_at)}</span>
                        </div>
                        <p className="text-[14px] leading-[1.45] font-bold text-foreground">{n.text}</p>
                        {n.author_name && <p className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{n.author_name}</p>}
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            </>
          )
        }}
      </SkolaPage>
    </div>
  )
}
