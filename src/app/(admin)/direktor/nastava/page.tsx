'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronRight, Clock, ShieldCheck, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Chip, EmptyState, KpiTile, Metric, SectionTitle } from '../../nastavnik/_components/widgets'
import { fmtDate, fmtHours, fmtNum, fmtPct, scoreColor } from '../_lib/direktor-client'
import { Bars, StatsPage } from '../_components/blocks'

type Sort = 'reads' | 'score' | 'fresh'

const lectureHref = (subject: string, id: string) => `/lectures/${encodeURIComponent(subject)}/${id}`

const STATUS_LABEL: Record<string, string> = {
  present: 'Prisutan',
  absent: 'Odsutan',
  sick: 'Bolovanje',
  trip: 'Ekskurzija',
  leave: 'Odsustvo',
}

export default function DirektorNastava() {
  const [sort, setSort] = useState<Sort>('reads')
  return (
    <StatsPage>
      {(s) => {
        const T = s.teaching
        const teachers = [...T.teachers].sort((a, b) => {
          if (sort === 'score') return (b.avg_score ?? -1) - (a.avg_score ?? -1)
          if (sort === 'fresh') return (a.days_since_publish ?? 999) - (b.days_since_publish ?? 999)
          return b.reads - a.reads
        })
        const maxReads = Math.max(1, ...T.teachers.map((t) => t.reads))
        const drafts = T.ai_drafts.by_status
        const draftsTotal = Math.max(1, T.ai_drafts.total)

        return (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <KpiTile label="Objavljene lekcije" value={fmtNum(T.kpi.lectures_published.value, 0)} kpi={T.kpi.lectures_published} color="#58CC02" info={`U periodu. Ukupno u aplikaciji: ${T.kpi.lectures_total}.`} />
              <KpiTile label="Aktivni profesori" value={fmtNum(T.kpi.active_teachers.value, 0)} kpi={T.kpi.active_teachers} info={`Profesori koji su objavili bar jednu lekciju. Ukupno: ${T.kpi.teachers_total}.`} />
              <KpiTile label="Do prvog čitanja" value={fmtHours(T.kpi.avg_first_read_lag_h)} color="#FF9600" info="Prosječno vrijeme od objave do prvog čitanja lekcije." hint="prosjek" />
              <KpiTile label="Čeka na pregled" value={fmtNum(T.kpi.ai_drafts_pending + T.kpi.photos_pending, 0)} color="#FF4B4B" info={`${T.kpi.ai_drafts_pending} AI nacrta i ${T.kpi.photos_pending} fotografija čeka moderaciju.`} hint={`${T.kpi.ai_drafts_pending} nacrta · ${T.kpi.photos_pending} foto`} href="/admin/moderation" />
            </div>

            <section className="space-y-2.5">
              <SectionTitle info="Profesori i njihove lekcije. Rezultat = prosjek kviza na njihovim lekcijama.">Profesori</SectionTitle>
              <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {([['reads', 'Čitanja'], ['score', 'Prosjek'], ['fresh', 'Svježina']] as const).map(([k, l]) => (
                  <Chip key={k} active={sort === k} onClick={() => setSort(k)} className="flex-shrink-0">{l}</Chip>
                ))}
              </div>
              {teachers.length === 0 ? (
                <EmptyState icon={BookOpen} title="Još nema lekcija" text="Profesori se pojave kad objave prvu lekciju." />
              ) : (
                <div className="space-y-2">
                  {teachers.map((t) => (
                    <Link key={t.author_id} href={`/nastavnik?author=${t.author_id}`} className="block rounded-2xl border-2 border-border bg-card px-3 py-2.5 shadow-[0_2px_0_var(--color-border)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none">
                      <div className="flex items-center gap-3">
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 flex-wrap">
                            <span className="text-[15px] font-extrabold text-heading truncate">{t.name}</span>
                            {t.status && <Badge variant={t.status === 'present' ? 'secondary' : 'outline'}>{STATUS_LABEL[t.status] ?? t.status}</Badge>}
                          </span>
                          <span className="block text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground truncate">{t.subject ?? 'Bez predmeta'} · {t.lectures} lekcija</span>
                        </span>
                        <span className="text-right flex-shrink-0">
                          <span className="block text-[18px] leading-none font-extrabold tabular-nums" style={{ color: scoreColor(t.avg_score) }}>{fmtPct(t.avg_score, 0)}</span>
                          <span className="block mt-1 text-[11px] font-bold text-muted-foreground">{t.days_since_publish === null ? 'nije objavljivao' : t.days_since_publish === 0 ? 'objavio danas' : `prije ${t.days_since_publish} d`}</span>
                        </span>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" strokeWidth={2.6} />
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[12px] font-bold text-muted-foreground">
                        <span className="w-16 flex-shrink-0">{fmtNum(t.reads, 0)} čit.</span>
                        <div className="flex-1 h-2.5 rounded-full bg-border overflow-hidden"><div className="h-full rounded-full bg-secondary" style={{ width: `${(t.reads / maxReads) * 100}%` }} /></div>
                        <span className="w-14 text-right flex-shrink-0">{fmtNum(t.opens, 0)} otv.</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Lekcije starije od 90 dana bez izmjene. Udio po predmetu.">Svježina sadržaja</SectionTitle>
              <Card className="gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-[#FFF3E0] text-[#C96A00] flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5" strokeWidth={2.6} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] leading-[1.25] font-extrabold text-heading tabular-nums">{fmtNum(T.freshness.stale, 0)} od {fmtNum(T.freshness.total, 0)} zastarjelo</p>
                    <p className="text-[13px] font-bold text-muted-foreground">{fmtPct(T.freshness.stale_pct, 0)} lekcija nije mijenjano 90+ dana</p>
                  </div>
                </div>
                <Bars
                  rows={[...T.freshness.by_subject].sort((a, b) => (b.stale_pct ?? 0) - (a.stale_pct ?? 0)).map((b) => ({ label: b.subject, value: b.stale_pct, sub: `${b.stale}/${b.total}`, href: `/direktor/ucenje/${encodeURIComponent(b.subject)}` }))}
                  max={100}
                  color="#FF9600"
                  format={(v) => fmtPct(v, 0)}
                />
              </Card>
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Lekcije napravljene pomoću AI: koliko ih je, koliko traje izrada i koliko su profesori mijenjali prije objave.">AI nacrti</SectionTitle>
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
              </Card>
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Fotografije i sadržaj koji čekaju odobrenje, brzina moderacije i ko moderira.">Moderacija</SectionTitle>
              <Card className="gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-[#E6FAD2] text-[#3E8A00] flex items-center justify-center flex-shrink-0"><ShieldCheck className="w-5 h-5" strokeWidth={2.6} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] leading-[1.25] font-extrabold text-heading tabular-nums">{fmtNum(T.moderation.pending, 0)} čeka</p>
                    <p className="text-[13px] font-bold text-muted-foreground">najstarije {fmtHours(T.moderation.oldest_pending_h)} · medijan {fmtHours(T.moderation.median_h)}</p>
                  </div>
                  <Link href="/admin/moderation" className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-secondary min-h-11 flex items-center">Otvori</Link>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <Metric label="Odobreno" value={fmtNum(T.moderation.approved, 0)} tone="good" />
                  <Metric label="Odbijeno" value={fmtNum(T.moderation.rejected, 0)} tone={T.moderation.rejected > 0 ? 'bad' : 'muted'} />
                  <Metric label="Odbijeno %" value={fmtPct(T.moderation.rejected_pct, 0)} />
                </div>
                {T.moderation.moderators.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {T.moderation.moderators.map((m) => <Badge key={m.name} variant="outline">{m.name} · {m.count}</Badge>)}
                  </div>
                )}
              </Card>
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Koliko otvaranja dobije nova lekcija u prva 24 i 72 sata.">Efekat objave</SectionTitle>
              {T.publish_effect.length === 0 ? (
                <Card><p className="text-[13px] font-bold text-muted-foreground">Nema novih lekcija u periodu.</p></Card>
              ) : (
                <Card className="gap-3">
                  {T.publish_effect.slice(0, 8).map((l) => {
                    const top = Math.max(1, ...T.publish_effect.map((x) => x.opens_72h))
                    return (
                      <Link key={l.lecture_id} href={lectureHref(l.subject, l.lecture_id)} className="block min-h-11">
                        <div className="flex items-center justify-between gap-2 text-[13px] font-extrabold">
                          <span className="truncate text-heading">{l.title}<span className="text-muted-foreground font-bold"> · {fmtDate(l.created_at)}</span></span>
                          <span className="tabular-nums text-heading flex-shrink-0">{l.opens_24h} / {l.opens_72h}</span>
                        </div>
                        <div className="relative h-3 rounded-full bg-border overflow-hidden mt-1">
                          <div className="absolute inset-y-0 left-0 rounded-full bg-[#84D8FF]" style={{ width: `${(l.opens_72h / top) * 100}%` }} />
                          <div className="absolute inset-y-0 left-0 rounded-full bg-secondary" style={{ width: `${(l.opens_24h / top) * 100}%` }} />
                        </div>
                      </Link>
                    )
                  })}
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">tamno = 24 h · svijetlo = 72 h</p>
                </Card>
              )}
            </section>
          </>
        )
      }}
    </StatsPage>
  )
}
