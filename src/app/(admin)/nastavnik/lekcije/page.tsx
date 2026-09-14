'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronRight, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { NastavnikLecture } from '@/lib/direktor-types'
import { PanelPage } from '../_components/page-shell'
import { Chip, EmptyState, RowSkeletons, SectionTitle } from '../_components/widgets'
import { fmtDate, fmtNum, fmtPct, lectureHref } from '../_lib/format'

type Sort = 'najnovije' | 'otvaranja' | 'procitano' | 'rezultat'

const SORTS: [Sort, string][] = [['najnovije', 'Najnovije'], ['otvaranja', 'Otvaranja'], ['procitano', 'Pročitano'], ['rezultat', 'Rezultat']]

function sortLectures(list: NastavnikLecture[], by: Sort): NastavnikLecture[] {
  const copy = [...list]
  switch (by) {
    case 'otvaranja': return copy.sort((a, b) => b.opens - a.opens)
    case 'procitano': return copy.sort((a, b) => b.reads - a.reads)
    case 'rezultat': return copy.sort((a, b) => (a.avg_score ?? 101) - (b.avg_score ?? 101))
    default: return copy.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
}

export default function NastavnikLekcije() {
  const [sort, setSort] = useState<Sort>('najnovije')
  return (
    <PanelPage title="Moje lekcije" subtitle="Svaka lekcija sa brojkama za izabrani period" skeleton={<RowSkeletons n={6} />}>
      {(s) => {
        const list = sortLectures(s.lectures, sort)
        return (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1" role="group" aria-label="Sortiraj">
              {SORTS.map(([k, label]) => (
                <Chip key={k} active={sort === k} onClick={() => setSort(k)}>{label}</Chip>
              ))}
            </div>

            {list.length === 0 ? (
              <EmptyState icon={BookOpen} title="Nema lekcija" text="Napravi prvu lekciju — AI je napiše iz fotografije ili teme." action={<Link href="/lectures/nova"><Button><Sparkles className="w-5 h-5" strokeWidth={2.6} /> Nova lekcija</Button></Link>} />
            ) : (
              <div className="space-y-2.5">
                {list.map((l) => (
                  <Link key={l.lecture_id} href={lectureHref(l.subject, l.lecture_id)} className="block">
                    <Card size="sm" className="gap-2 transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none">
                      <div className="flex items-start gap-3">
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 flex-wrap">
                            <span className="text-[12px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{l.subject} · {l.class_number}. razred</span>
                            {l.has_homework && <Badge variant="gold">Domaći</Badge>}
                            {l.stale && <Badge variant="outline">Zastarjelo</Badge>}
                          </span>
                          <span className="block mt-1 text-[15px] leading-[1.3] font-extrabold text-heading">{l.title}</span>
                          <span className="block mt-0.5 text-[13px] font-bold text-muted-foreground">Objavljeno {fmtDate(l.created_at)}{l.last_activity ? ` · zadnja aktivnost ${fmtDate(l.last_activity)}` : ''}</span>
                        </span>
                        <ChevronRight className="w-5 h-5 text-disabled flex-shrink-0 mt-1" strokeWidth={2.6} />
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {[
                          ['Otvaranja', fmtNum(l.opens)],
                          ['Pročitano', fmtNum(l.reads)],
                          ['Kvizovi', fmtNum(l.quiz_finishes)],
                          ['Prosjek', fmtPct(l.avg_score)],
                        ].map(([label, value]) => (
                          <span key={label} className="rounded-xl bg-muted px-1 py-2">
                            <span className="block text-[17px] leading-none font-extrabold text-heading tabular-nums">{value}</span>
                            <span className="block mt-1 text-[11px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{label}</span>
                          </span>
                        ))}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            <SectionTitle action={<Link href="/lectures/nova"><Button size="sm"><Sparkles className="w-4 h-4" strokeWidth={2.6} /> Nova</Button></Link>}>Dodaj lekciju</SectionTitle>
          </div>
        )
      }}
    </PanelPage>
  )
}
