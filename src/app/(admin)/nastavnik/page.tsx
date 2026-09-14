'use client'

import Link from 'next/link'
import { AlertTriangle, ImageIcon, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PanelPage } from './_components/page-shell'
import { KpiTile, KpiSkeletonGrid, SectionTitle, SignalList, Metric, ProgressBar } from './_components/widgets'
import { fmtNum, fmtPct, fmtHours } from './_lib/format'
const fmtInt = (v: number | null | undefined) => fmtNum(v, 0)

export default function NastavnikPregled() {
  return (
    <PanelPage title="Profesor" subtitle="Kako učenici rade sa tvojim lekcijama" skeleton={<KpiSkeletonGrid n={6} />}>
      {(s) => {
        const weak = s.classes.flatMap((c) => c.weak_topics.map((t) => ({ ...t, class_number: c.class_number }))).sort((a, b) => (a.avg_score ?? 101) - (b.avg_score ?? 101)).slice(0, 5)
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2.5">
              <KpiTile label="Objavljene lekcije" value={fmtInt(s.kpi.lectures_published.value)} kpi={s.kpi.lectures_published} color="#58CC02" info="Lekcije koje si objavio u izabranom periodu." hint={`ukupno ${s.kpi.lectures_total}`} />
              <KpiTile label="Otvaranja" value={fmtInt(s.kpi.opens.value)} kpi={s.kpi.opens} info="Koliko puta su učenici otvorili tvoje lekcije." />
              <KpiTile label="Pročitano" value={fmtInt(s.kpi.reads.value)} kpi={s.kpi.reads} color="#58CC02" info="Lekcije označene kao pročitane." />
              <KpiTile label="Prosjek kviza" value={fmtPct(s.kpi.avg_score.value, 0)} kpi={s.kpi.avg_score} color="#FFC800" info="Prosječan rezultat kvizova uz tvoje lekcije." />
              <KpiTile label="Učenika doseglo" value={fmtInt(s.kpi.students_reached.value)} kpi={s.kpi.students_reached} color="#CE82FF" info="Različitih učenika koji su otvorili bar jednu tvoju lekciju." />
              <KpiTile label="Do prvog čitanja" value={fmtHours(s.kpi.first_read_lag_h.value)} kpi={s.kpi.first_read_lag_h} invert color="#FF9600" info="Vrijeme od objave do prvog čitanja — kraće je bolje." />
            </div>

            <Card className="gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[15px] font-extrabold text-heading">Domaći urađen</span>
                <span className="text-[20px] font-extrabold text-heading tabular-nums">{fmtPct(s.kpi.homework_done_pct, 0)}</span>
              </div>
              <ProgressBar pct={s.kpi.homework_done_pct} />
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <Metric label="Napušteni kvizovi" value={fmtPct(s.kpi.abandon_rate, 0)} tone={(s.kpi.abandon_rate ?? 0) > 40 ? 'bad' : 'muted'} />
                <Metric label="Zastarjele lekcije" value={fmtInt(s.kpi.stale_lectures)} tone={s.kpi.stale_lectures > 0 ? 'bad' : 'good'} />
                <Metric label="Fotografije na moderaciji" value={fmtInt(s.moderation.photos_pending)} tone={s.moderation.photos_pending > 0 ? 'bad' : 'good'} />
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-2.5">
              <Link href="/lectures/nova" className="block">
                <Button className="w-full h-14"><Sparkles className="w-5 h-5" strokeWidth={2.6} /> Nova lekcija</Button>
              </Link>
              <Link href="/admin/photos" className="block">
                <Button variant="outline" className="w-full h-14"><ImageIcon className="w-5 h-5" strokeWidth={2.6} /> Moderacija{s.moderation.photos_pending > 0 ? ` · ${s.moderation.photos_pending}` : ''}</Button>
              </Link>
            </div>

            <section className="space-y-2.5">
              <SectionTitle info="Lekcije sa najslabijim rezultatom kviza ili najviše napuštanja.">Slabe teme</SectionTitle>
              {weak.length === 0 ? (
                <Card><p className="text-[13px] font-bold text-muted-foreground">Nema tema sa slabim rezultatima u ovom periodu.</p></Card>
              ) : weak.map((t) => (
                <Link key={t.lecture_id + t.class_number} href={`/lectures/${encodeURIComponent(t.subject)}/${t.lecture_id}`} className="block">
                  <Card className="flex-row items-center gap-3 p-3.5 transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none">
                    <span className="w-11 h-11 rounded-full bg-[#FFDFE0] text-[#EA2B2B] flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5" strokeWidth={2.6} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-extrabold text-heading truncate">{t.title}</span>
                      <span className="block text-[13px] font-bold text-muted-foreground">{t.class_number}. razred · {t.attempts} pokušaja{t.abandon_rate !== null ? ` · napušteno ${fmtPct(t.abandon_rate, 0)}` : ''}</span>
                    </span>
                    <Badge variant={(t.avg_score ?? 100) < 50 ? 'destructive' : 'gold'}>{fmtPct(t.avg_score, 0)}</Badge>
                  </Card>
                </Link>
              ))}
            </section>

            <section className="space-y-2.5">
              <SectionTitle>Signali</SectionTitle>
              <SignalList signals={s.signals} limit={6} />
            </section>
          </div>
        )
      }}
    </PanelPage>
  )
}
