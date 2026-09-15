'use client'

import Link from 'next/link'
import { CalendarDays, Images, Newspaper, Sparkles } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState, KpiTile, Metric, SectionTitle } from '../../nastavnik/_components/widgets'
import { fmtDate, fmtNum, fmtPct } from '../../direktor/_lib/direktor-client'
import { AppPage } from '../_lib/app-client'

/** Sadržaj: news, events, gallery and AI-made lectures. */
export default function AplikacijaSadrzaj() {
  return (
    <AppPage>
      {(s) => {
        const C = s.community
        const T = s.teaching
        const bestMax = Math.max(1, ...C.best_hours)
        const bestHour = C.best_hours.indexOf(bestMax)
        const maxNewsViews = Math.max(1, ...C.news.map((n) => n.views))
        const weekly = C.gallery.weekly.map((w) => ({ w: w.week_start.slice(5), odobreno: w.approved, odbijeno: w.rejected, ceka: w.pending }))
        const drafts = T.ai_drafts.by_status
        const draftsTotal = Math.max(1, T.ai_drafts.total)

        return (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <KpiTile label="Doseg vijesti" value={fmtPct(C.kpi.news_reach_pct.value, 0)} kpi={C.kpi.news_reach_pct} info="Udio učenika koji su otvorili bar jednu vijest u periodu." />
              <KpiTile label="Lajkovi" value={fmtNum(C.kpi.likes.value, 0)} kpi={C.kpi.likes} color="#FF4B4B" info="Lajkovi na vijestima i fotografijama." />
              <KpiTile label="Pregledi događaja" value={fmtNum(C.kpi.event_views.value, 0)} kpi={C.kpi.event_views} color="#FFC800" info="Otvaranja događaja u kalendaru." />
              <KpiTile label="Fotografije" value={fmtNum(C.kpi.gallery_uploads.value, 0)} kpi={C.kpi.gallery_uploads} color="#CE82FF" info="Poslate fotografije u galeriju." />
            </div>

            <section className="space-y-2.5">
              <SectionTitle info="Vijesti po broju pregleda. Doseg = udio učenika koji su je otvorili.">Vijesti</SectionTitle>
              {C.news.length === 0 ? (
                <EmptyState icon={Newspaper} title="Nema vijesti u periodu" />
              ) : (
                <Card className="gap-3">
                  {C.news.slice(0, 8).map((n) => (
                    <div key={n.id} className="min-h-11">
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
                    </div>
                  ))}
                  <div className="space-y-1">
                    <p className="text-[13px] font-extrabold text-heading">{bestMax > 0 ? `Najbolje vrijeme za objavu: oko ${bestHour}:00` : 'Još nema dovoljno pregleda za najbolje vrijeme'}</p>
                    <div className="flex items-end gap-[2px] h-10">
                      {C.best_hours.map((v, h) => (
                        <span key={h} className="flex-1 rounded-t-[3px]" style={{ height: `${Math.max(4, (v / bestMax) * 100)}%`, background: h === bestHour && bestMax > 0 ? '#1CB0F6' : '#DDF4FF' }} title={`${h}:00 — ${v}`} />
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] font-extrabold text-muted-foreground"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span></div>
                  </div>
                </Card>
              )}
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
                  <div className="h-[150px]">
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
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <Metric label="Čeka moderaciju" value={fmtNum(T.moderation.pending, 0)} tone={T.moderation.pending > 0 ? 'bad' : 'good'} />
                  <Metric label="Odobreno" value={fmtNum(T.moderation.approved, 0)} />
                  <Metric label="Odbijeno" value={fmtNum(T.moderation.rejected, 0)} />
                </div>
                {C.gallery.top_classes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground self-center">Najaktivniji:</span>
                    {C.gallery.top_classes.map((c) => <Badge key={`${c.class_number}-${c.section_number}`} variant="secondary">{c.class_number}-{c.section_number} · {c.uploads}</Badge>)}
                  </div>
                )}
                <div className="flex gap-4">
                  <Link href="/gallery" className="inline-flex items-center gap-1 min-h-11 text-[12px] font-extrabold uppercase tracking-[0.04em] text-secondary"><Images className="w-4 h-4" strokeWidth={2.6} /> Galerija</Link>
                  <Link href="/admin/moderation" className="inline-flex items-center gap-1 min-h-11 text-[12px] font-extrabold uppercase tracking-[0.04em] text-secondary">Moderacija</Link>
                </div>
              </Card>
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Lekcije napravljene pomoću AI: koliko ih je, koliko traje izrada i koliko su profesori mijenjali prije objave.">AI‑lekcije</SectionTitle>
              <Card className="gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-[#F3E3FF] text-accent-dark flex items-center justify-center flex-shrink-0"><Sparkles className="w-5 h-5" strokeWidth={2.6} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] leading-[1.25] font-extrabold text-heading tabular-nums">{fmtNum(T.ai_drafts.total, 0)} nacrta</p>
                    <p className="text-[13px] font-bold text-muted-foreground">izrada ≈ {T.ai_drafts.avg_generation_min === null ? '—' : `${fmtNum(T.ai_drafts.avg_generation_min, 1)} min`} · uređeno prije objave {fmtPct(T.ai_drafts.edited_before_publish_pct, 0)}</p>
                  </div>
                </div>
                {drafts.length > 0 && (
                  <div className="space-y-1.5">
                    {drafts.map((d) => (
                      <div key={d.status} className="flex items-center gap-2 text-[13px] font-bold">
                        <span className="w-24 text-muted-foreground capitalize truncate">{d.status.replace(/_/g, ' ')}</span>
                        <div className="flex-1 h-3 rounded-full bg-border overflow-hidden"><div className="h-full rounded-full bg-accent" style={{ width: `${(d.count / draftsTotal) * 100}%` }} /></div>
                        <span className="w-8 text-right tabular-nums text-heading">{d.count}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Metric label="Čeka pregled" value={fmtNum(T.kpi.ai_drafts_pending, 0)} tone={T.kpi.ai_drafts_pending > 0 ? 'bad' : 'muted'} />
              </Card>
            </section>
          </>
        )
      }}
    </AppPage>
  )
}
