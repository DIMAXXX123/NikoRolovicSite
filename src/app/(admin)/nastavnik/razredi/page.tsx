'use client'

import Link from 'next/link'
import { AlertTriangle, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { PanelPage } from '../_components/page-shell'
import { EmptyState, Metric, ProgressBar, RowSkeletons } from '../_components/widgets'
import { PRIVACY_TEXT, fmtNum, fmtPct, lectureHref } from '../_lib/format'

export default function NastavnikRazredi() {
  return (
    <PanelPage title="Razredi" subtitle="Razredi kojima predaješ — po tvojim lekcijama" skeleton={<RowSkeletons n={4} />}>
      {(s) =>
        s.classes.length === 0 ? (
          <EmptyState icon={Users} title="Još nema razreda" text="Razredi se pojave kad objaviš lekcije za njih." />
        ) : (
          <div className="space-y-3">
            {s.classes.map((c) => {
              const delta = c.avg_score !== null && c.prev_avg_score !== null ? c.avg_score - c.prev_avg_score : null
              return (
                <Card key={c.class_number} className="gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[20px] leading-[1.25] font-extrabold text-heading">{c.class_number}. razred</span>
                    <span className="text-[13px] font-bold text-muted-foreground">{c.lectures} lekcija · {c.registered}/{c.students_total} učenika</span>
                  </div>
                  {c.k_hidden ? (
                    <p className="text-[13px] font-bold text-muted-foreground">{PRIVACY_TEXT}</p>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center justify-between text-[13px] font-bold text-muted-foreground mb-1.5">
                          <span>Aktivno 7 dana</span>
                          <span className="text-heading">{fmtPct(c.active_7d_pct)}</span>
                        </div>
                        <ProgressBar pct={c.active_7d_pct} color="#1CB0F6" />
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-2">
                        <Metric label="Otvaranja" value={fmtNum(c.opens)} />
                        <Metric label="Pročitano" value={fmtNum(c.reads)} />
                        <Metric label="Kvizovi" value={fmtNum(c.quiz_finishes)} />
                        <Metric label="Prosjek" value={fmtPct(c.avg_score)} tone={(c.avg_score ?? 100) < 50 ? 'bad' : (c.avg_score ?? 0) >= 75 ? 'good' : 'muted'} />
                        {delta !== null && <Metric label="Promjena" value={`${delta > 0 ? '+' : ''}${fmtNum(delta)} p.p.`} tone={delta < 0 ? 'bad' : delta > 0 ? 'good' : 'muted'} />}
                      </div>
                    </>
                  )}
                  {c.weak_topics.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[12px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Slabe teme</p>
                      {c.weak_topics.slice(0, 3).map((t) => (
                        <Link key={t.lecture_id} href={lectureHref(t.subject, t.lecture_id)} className="flex items-center gap-2 min-h-11 rounded-xl border-2 border-[#FFE28A] bg-[#FFF9E0] px-3 py-2">
                          <AlertTriangle className="w-4 h-4 text-[#C79000] flex-shrink-0" strokeWidth={2.6} />
                          <span className="min-w-0 flex-1 text-[13px] font-extrabold text-heading truncate">{t.title}</span>
                          <Badge variant={(t.avg_score ?? 100) < 50 ? 'destructive' : 'gold'}>{fmtPct(t.avg_score)}</Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )
      }
    </PanelPage>
  )
}
