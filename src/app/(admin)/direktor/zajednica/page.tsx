'use client'

import Link from 'next/link'
import { Bell, CalendarDays, Gamepad2, Images, Link2, Newspaper } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState, KpiTile, Metric, ProgressBar, SectionTitle } from '../../nastavnik/_components/widgets'
import { fmtDate, fmtNum, fmtPct, fmtSecs } from '../_lib/direktor-client'
import { StatsPage } from '../_components/blocks'

const PUSH_LABEL: Record<string, string> = {
  news: 'Vijesti',
  event: 'Događaji',
  lecture: 'Lekcije',
  homework: 'Domaći',
  gallery: 'Galerija',
  system: 'Sistem',
}

export default function DirektorZajednica() {
  return (
    <StatsPage>
      {(s) => {
        const C = s.community
        const bestMax = Math.max(1, ...C.best_hours)
        const bestHour = C.best_hours.indexOf(bestMax)
        const weekly = C.gallery.weekly.map((w) => ({ w: w.week_start.slice(5), odobreno: w.approved, odbijeno: w.rejected, ceka: w.pending }))
        const maxNewsViews = Math.max(1, ...C.news.map((n) => n.views))

        return (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <KpiTile label="Doseg vijesti" value={fmtPct(C.kpi.news_reach_pct.value, 0)} kpi={C.kpi.news_reach_pct} info="Udio učenika koji su otvorili bar jednu vijest u periodu." />
              <KpiTile label="Lajkovi" value={fmtNum(C.kpi.likes.value, 0)} kpi={C.kpi.likes} color="#FF4B4B" info="Lajkovi na vijestima i fotografijama." />
              <KpiTile label="Pregledi događaja" value={fmtNum(C.kpi.event_views.value, 0)} kpi={C.kpi.event_views} color="#FFC800" info="Otvaranja događaja u kalendaru." />
              <KpiTile label="Fotografije" value={fmtNum(C.kpi.gallery_uploads.value, 0)} kpi={C.kpi.gallery_uploads} color="#CE82FF" info="Poslate fotografije u galeriju." />
              <KpiTile label="Igra" value={fmtNum(C.kpi.game_sessions.value, 0)} kpi={C.kpi.game_sessions} color="#58CC02" info="Odigrane partije." />
              <KpiTile label="Dijeljenja" value={fmtNum(C.kpi.shares.value, 0)} kpi={C.kpi.shares} color="#FF9600" info="Podijeljeni linkovi na vijesti, lekcije i fotografije." />
            </div>

            <section className="space-y-2.5">
              <SectionTitle info="Vijesti po broju pregleda. Doseg = udio učenika koji su je otvorili.">Vijesti</SectionTitle>
              {C.news.length === 0 ? (
                <EmptyState icon={Newspaper} title="Nema vijesti u periodu" />
              ) : (
                <Card className="gap-3">
                  {C.news.slice(0, 8).map((n) => (
                    <Link key={n.id} href="/news" className="block min-h-11">
                      <div className="flex items-center justify-between gap-2 text-[13px] font-extrabold">
                        <span className="truncate text-heading">{n.title}<span className="text-muted-foreground font-bold"> · {fmtDate(n.created_at)}</span></span>
                        <span className="tabular-nums text-heading flex-shrink-0">{fmtNum(n.views, 0)}</span>
                      </div>
                      <div className="h-3 rounded-full bg-border overflow-hidden mt-1"><div className="h-full rounded-full bg-secondary" style={{ width: `${(n.views / maxNewsViews) * 100}%` }} /></div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">
                        <span>doseg {fmtPct(n.reach_pct, 0)}</span>
                        <span>♥ {n.likes}</span>
                        {n.days_to_peak !== null && <span>vrhunac {n.days_to_peak === 0 ? 'isti dan' : `${n.days_to_peak}. dan`}</span>}
                      </div>
                    </Link>
                  ))}
                </Card>
              )}
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="U koje doba dana učenici najviše čitaju vijesti — najbolje vrijeme za objavu.">Kad objaviti</SectionTitle>
              <Card className="gap-2">
                <p className="text-[15px] font-extrabold text-heading">{bestMax > 0 ? `Najbolje oko ${bestHour}:00` : 'Još nema dovoljno pregleda'}</p>
                <div className="flex items-end gap-[2px] h-16">
                  {C.best_hours.map((v, h) => (
                    <span key={h} className="flex-1 rounded-t-[3px]" style={{ height: `${Math.max(4, (v / bestMax) * 100)}%`, background: h === bestHour && bestMax > 0 ? '#1CB0F6' : '#DDF4FF' }} title={`${h}:00 — ${v}`} />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-extrabold text-muted-foreground"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span></div>
              </Card>
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Događaji iz kalendara i koliko su puta otvoreni.">Događaji</SectionTitle>
              {C.events.length === 0 ? (
                <EmptyState icon={CalendarDays} title="Nema događaja u periodu" />
              ) : (
                <div className="space-y-2">
                  {C.events.slice(0, 6).map((e) => (
                    <Link key={e.id} href="/events" className="flex items-center gap-3 min-h-14 rounded-2xl border-2 border-border bg-card px-3 py-2 shadow-[0_2px_0_var(--color-border)]">
                      <span className="w-11 h-11 rounded-full bg-[#FFF9E0] text-[#C79000] flex items-center justify-center flex-shrink-0"><CalendarDays className="w-5 h-5" strokeWidth={2.6} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-extrabold text-heading truncate">{e.title}</span>
                        <span className="block text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{fmtDate(e.event_date)}{e.event_type ? ` · ${e.event_type}` : ''}</span>
                      </span>
                      <span className="text-[15px] font-extrabold text-heading tabular-nums">{fmtNum(e.views, 0)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Poslate fotografije po sedmicama i ishod moderacije.">Galerija</SectionTitle>
              <Card className="gap-3">
                {weekly.length === 0 ? (
                  <p className="text-[13px] font-bold text-muted-foreground">Nema poslatih fotografija u periodu.</p>
                ) : (
                  <div className="h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weekly} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                        <XAxis dataKey="w" tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="odobreno" name="Odobreno" stackId="a" fill="#58CC02" isAnimationActive={false} />
                        <Bar dataKey="ceka" name="Čeka" stackId="a" fill="#FFC800" isAnimationActive={false} />
                        <Bar dataKey="odbijeno" name="Odbijeno" stackId="a" fill="#FF4B4B" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {C.gallery.top_classes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground self-center">Najaktivniji:</span>
                    {C.gallery.top_classes.map((c) => (
                      <Link key={`${c.class_number}-${c.section_number}`} href={`/direktor/razredi/${c.class_number}-${c.section_number}`}><Badge variant="secondary">{c.class_number}-{c.section_number} · {c.uploads}</Badge></Link>
                    ))}
                  </div>
                )}
                <Link href="/gallery" className="inline-flex items-center gap-1 min-h-11 text-[12px] font-extrabold uppercase tracking-[0.04em] text-secondary"><Images className="w-4 h-4" strokeWidth={2.6} /> Otvori galeriju</Link>
              </Card>
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Igra u aplikaciji i da li igrači više čitaju lekcije od onih koji ne igraju.">Igra</SectionTitle>
              <Card className="gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-[#E6FAD2] text-[#3E8A00] flex items-center justify-center flex-shrink-0"><Gamepad2 className="w-5 h-5" strokeWidth={2.6} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] leading-[1.25] font-extrabold text-heading tabular-nums">{fmtNum(C.game.sessions, 0)} partija · {fmtNum(C.game.players, 0)} igrača</p>
                    <p className="text-[13px] font-bold text-muted-foreground">prosjek {fmtNum(C.game.avg_score, 0)} · medijan {fmtSecs(C.game.median_duration_s)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl bg-muted py-3">
                    <span className="block text-[22px] leading-none font-extrabold text-heading tabular-nums">{fmtPct(C.game.readers_among_players_pct, 0)}</span>
                    <span className="block mt-1 text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">igrači koji čitaju</span>
                  </div>
                  <div className="rounded-xl bg-muted py-3">
                    <span className="block text-[22px] leading-none font-extrabold text-heading tabular-nums">{fmtPct(C.game.readers_among_nonplayers_pct, 0)}</span>
                    <span className="block mt-1 text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">ne-igrači koji čitaju</span>
                  </div>
                </div>
              </Card>
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Push obavještenja: koliko je primljeno i otvoreno, po vrsti.">Obavještenja</SectionTitle>
              <Card className="gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-[#DDF4FF] text-secondary flex items-center justify-center flex-shrink-0"><Bell className="w-5 h-5" strokeWidth={2.6} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] leading-[1.25] font-extrabold text-heading tabular-nums">{fmtPct(C.push.open_rate, 0)} otvoreno</p>
                    <p className="text-[13px] font-bold text-muted-foreground">{fmtNum(C.push.opened, 0)} od {fmtNum(C.push.received, 0)} primljenih</p>
                  </div>
                </div>
                {C.push.by_type.length > 0 && (
                  <div className="space-y-2">
                    {C.push.by_type.map((t) => {
                      const pct = t.received > 0 ? (t.opened / t.received) * 100 : null
                      return (
                        <div key={t.type}>
                          <div className="flex items-center justify-between text-[13px] font-bold text-muted-foreground mb-1">
                            <span>{PUSH_LABEL[t.type] ?? t.type} · {t.opened}/{t.received}</span>
                            <span className="text-heading">{fmtPct(pct, 0)}</span>
                          </div>
                          <ProgressBar pct={pct} color="#1CB0F6" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Koliko učenika je povezalo eDnevnik i koliko sinhronizacija prolazi dnevno.">eDnevnik</SectionTitle>
              <Card className="gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-[#F3E3FF] text-accent-dark flex items-center justify-center flex-shrink-0"><Link2 className="w-5 h-5" strokeWidth={2.6} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] leading-[1.25] font-extrabold text-heading tabular-nums">{fmtNum(C.ednevnik.connected, 0)} povezano · {fmtPct(C.ednevnik.connected_pct, 0)}</p>
                    <p className="text-[13px] font-bold text-muted-foreground">{fmtNum(C.ednevnik.syncs_per_day, 1)} sinhronizacija dnevno</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <Metric label="Greške" value={fmtNum(C.ednevnik.sync_errors, 0)} tone={C.ednevnik.sync_errors > 0 ? 'bad' : 'good'} />
                </div>
              </Card>
            </section>
          </>
        )
      }}
    </StatsPage>
  )
}
