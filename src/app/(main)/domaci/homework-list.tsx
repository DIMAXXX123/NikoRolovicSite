'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Check, ClipboardList, Lightbulb } from 'lucide-react'
import { useLocalJson } from '@/lib/local-json'
import { HOMEWORK_DONE_KEY, toggleHomeworkDone } from '../lectures/[subject]/[id]/homework-card'
import { haptic } from '@/lib/haptics'
import { SubjectIcon } from '../lectures/subject-icon'
import { DEFAULT_SUBJECTS, OPTIONAL_SUBJECTS } from '../lectures/subjects'
import type { HomeworkItem } from '../lectures/homework-block'

const NO_DONE: Record<string, string> = {}
const SUBJECTS = [...DEFAULT_SUBJECTS, ...OPTIONAL_SUBJECTS]

type Filter = 'aktivni' | 'uradjeni' | 'svi'

const CHIP = 'h-11 px-4 rounded-xl border-2 text-[12px] font-extrabold uppercase tracking-[0.04em] flex items-center justify-center gap-2 transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const CHIP_ON = 'border-secondary-light-border bg-secondary-light text-secondary shadow-[0_2px_0_var(--color-secondary-light-border)]'
const CHIP_OFF = 'border-border bg-card text-muted-foreground shadow-[0_2px_0_var(--color-border)]'

function formatDue(due: string | null): string | null {
  if (!due) return null
  const [y, m, d] = due.split('-').map(Number)
  return y && m && d ? `${d}. ${m}.` : null
}

function daysLeft(due: string | null, today: string): number | null {
  if (!due) return null
  const a = new Date(due + 'T00:00:00').getTime()
  const b = new Date(today + 'T00:00:00').getTime()
  return Math.round((a - b) / 86400000)
}

/** Homework as first-class items: a filterable list, each opening its own page. */
export function HomeworkList({ items, today }: { items: HomeworkItem[]; today: string }) {
  const done = useLocalJson<Record<string, string>>(HOMEWORK_DONE_KEY, NO_DONE)
  const [filter, setFilter] = useState<Filter>('aktivni')

  const isDone = (id: string) => !!done[id]
  const visible = items.filter((it) => (filter === 'svi' ? true : filter === 'uradjeni' ? isDone(it.lectureId) : !isDone(it.lectureId)))
  const activeCount = items.filter((it) => !isDone(it.lectureId)).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {([['aktivni', `Aktivni · ${activeCount}`], ['uradjeni', `Urađeni · ${items.length - activeCount}`], ['svi', `Svi · ${items.length}`]] as [Filter, string][]).map(([f, label]) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`${CHIP} ${filter === f ? CHIP_ON : CHIP_OFF}`} aria-pressed={filter === f}>
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-disabled" strokeWidth={2.4} />
          </div>
          <p className="text-[17px] font-extrabold text-foreground">{filter === 'uradjeni' ? 'Još ništa nije označeno kao urađeno' : 'Nema domaćih zadataka'}</p>
          <p className="text-[13px] font-bold text-muted-foreground mt-1">Domaći se dodaje uz lekciju — „Nova lekcija sa AI“ → „Domaći“.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map((it) => {
            const info = SUBJECTS.find((s) => s.name === it.subject)
            const due = formatDue(it.homework.due)
            const left = daysLeft(it.homework.due, today)
            const finished = isDone(it.lectureId)
            const overdue = !finished && left !== null && left < 0
            const first = it.homework.tasks[0]
            const image = it.homework.images[0]
            return (
              <div
                key={it.lectureId}
                className={`flex items-center gap-2 min-h-16 p-2 pl-3 rounded-2xl border-2 bg-card ${
                  finished ? 'border-primary-light-border shadow-[0_2px_0_var(--color-primary-light-border)]' : overdue ? 'border-[#FFB3B5] shadow-[0_2px_0_#FFB3B5]' : 'border-[#FFE28A] shadow-[0_2px_0_#FFE28A]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => { haptic(finished ? 6 : 14); toggleHomeworkDone(it.lectureId) }}
                  aria-pressed={finished}
                  aria-label={finished ? 'Poništi urađeno' : 'Označi kao urađeno'}
                  className={`w-11 h-11 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-[transform,background-color,border-color] duration-[120ms] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                    finished ? 'bg-primary border-primary text-primary-foreground shadow-[0_3px_0_var(--color-primary-dark)]' : 'bg-card border-border-strong text-transparent shadow-[0_3px_0_var(--color-border)]'
                  }`}
                >
                  <Check className="w-6 h-6" strokeWidth={3.2} />
                </button>
                <Link href={`/domaci/${it.lectureId}`} className="flex items-center gap-3 min-w-0 flex-1 min-h-11 rounded-xl">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="w-12 h-12 rounded-xl object-cover border-2 border-border flex-shrink-0" />
                  ) : info ? (
                    <SubjectIcon name={info.name} emoji={info.emoji} size="sm" />
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{it.subject}</span>
                      {finished ? (
                        <span className="text-[11px] leading-none font-extrabold uppercase tracking-[0.06em] px-2 py-1 rounded-full border-2 border-primary-light-border bg-primary-light text-primary-text">Urađeno</span>
                      ) : due ? (
                        <span className={`text-[11px] leading-none font-extrabold uppercase tracking-[0.06em] px-2 py-1 rounded-full border-2 ${overdue ? 'border-[#FFB3B5] bg-[#FFDFE0] text-[#EA2B2B]' : 'border-[#FFE28A] bg-[#FFF4C4] text-[#C79000]'}`}>
                          {overdue ? `Kasni ${-left} d` : left === 0 ? 'Danas' : left === 1 ? 'Sutra' : `Rok: ${due}`}
                        </span>
                      ) : null}
                    </span>
                    <span className={`block mt-1 text-[15px] leading-[1.3] font-extrabold truncate ${finished ? 'text-muted-foreground line-through decoration-2' : 'text-heading'}`}>{it.title}</span>
                    <span className="block mt-0.5 text-[13px] leading-[1.4] font-bold text-muted-foreground line-clamp-1">
                      {first ? `${first.label}: ${first.what}` : it.homework.text}
                    </span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-disabled flex-shrink-0" strokeWidth={2.6} />
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {visible.length > 0 && (
        <p className="flex items-center gap-2 text-[13px] font-bold text-muted-foreground px-1">
          <Lightbulb className="w-4 h-4 text-[#C79000] flex-shrink-0" strokeWidth={2.6} />
          Tapni kružić kad uradiš zadatak. Otvori red za uputstvo, sliku iz udžbenika i lekciju.
        </p>
      )}
    </div>
  )
}
