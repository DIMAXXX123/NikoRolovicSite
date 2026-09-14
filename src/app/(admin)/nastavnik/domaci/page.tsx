'use client'

import Link from 'next/link'
import { ClipboardList, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PanelPage } from '../_components/page-shell'
import { EmptyState, ProgressBar, RowSkeletons, SectionTitle } from '../_components/widgets'
import { PRIVACY_TEXT, fmtDate, fmtPct, lectureHref } from '../_lib/format'

export default function NastavnikDomaci() {
  return (
    <PanelPage title="Domaći" subtitle="Ko je uradio šta — po lekciji" skeleton={<RowSkeletons n={5} />}>
      {(s) => {
        const withHw = s.homework.filter((h) => h.has_homework)
        const withoutHw = s.homework.filter((h) => !h.has_homework).slice(0, 8)
        return (
          <div className="space-y-5">
            {withHw.length === 0 ? (
              <EmptyState icon={ClipboardList} title="Nema zadatih domaćih" text="Dodaj domaći uz lekciju — fotografija zadataka i rok." action={<Link href="/lectures/nova"><Button><Plus className="w-5 h-5" strokeWidth={2.8} /> Dodaj domaći</Button></Link>} />
            ) : (
              <div className="space-y-2.5">
                {withHw.map((h) => (
                  <Link key={h.lecture_id} href={`/domaci/${h.lecture_id}`} className="block">
                    <Card size="sm" className={`gap-2.5 transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none ${h.overdue ? 'border-[#FFB3B5] shadow-[0_2px_0_#FFB3B5]' : 'border-[#FFE28A] shadow-[0_2px_0_#FFE28A]'}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{h.subject} · {h.class_number}. razred</span>
                        {h.due && <Badge variant={h.overdue ? 'destructive' : 'gold'}>{h.overdue ? 'Rok prošao' : `Rok: ${fmtDate(h.due)}`}</Badge>}
                        <Badge variant="outline">{h.tasks} zad.</Badge>
                      </div>
                      <p className="text-[15px] leading-[1.3] font-extrabold text-heading">{h.title}</p>
                      {h.k_hidden ? (
                        <p className="text-[13px] font-bold text-muted-foreground">{PRIVACY_TEXT}</p>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-[13px] font-bold text-muted-foreground">
                            <span>Urađeno {h.done} od {h.registered}</span>
                            <span className="text-heading">{fmtPct(h.done_pct)}</span>
                          </div>
                          <ProgressBar pct={h.done_pct} />
                        </>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {withoutHw.length > 0 && (
              <section className="space-y-2.5">
                <SectionTitle info="Lekcije bez domaćeg — dodaj zadatke uz njih.">Bez domaćeg</SectionTitle>
                {withoutHw.map((h) => (
                  <div key={h.lecture_id} className="flex items-center gap-3 min-h-14 rounded-2xl border-2 border-border bg-card px-3 py-2 shadow-[0_2px_0_var(--color-border)]">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{h.subject} · {h.class_number}. razred</span>
                      <span className="block mt-1 text-[15px] font-extrabold text-heading truncate">{h.title}</span>
                    </span>
                    <Link href={`/lectures/nova?subject=${encodeURIComponent(h.subject)}`}><Button size="sm" variant="outline"><Plus className="w-4 h-4" strokeWidth={2.8} /> Domaći</Button></Link>
                    <Link href={lectureHref(h.subject, h.lecture_id)} className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-secondary min-h-11 flex items-center px-1">Otvori</Link>
                  </div>
                ))}
              </section>
            )}
          </div>
        )
      }}
    </PanelPage>
  )
}
