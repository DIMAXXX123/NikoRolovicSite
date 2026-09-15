'use client'

import { useState } from 'react'
import { Check, Eye, Lightbulb, PencilLine } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { haptic } from '@/lib/haptics'
import { track } from '@/lib/analytics'
import type { Exercise } from '../../lecture-utils'
import { formatMath } from '../../lecture-utils'

/**
 * "Zadaci za vježbu" — the EXERCISES block. Each task hides its hint and
 * solution behind taps so the pupil tries first; a solved tick is local UI.
 */
export function ExercisesCard({ lectureId, exercises }: { lectureId: string; exercises: Exercise[] }) {
  const [hint, setHint] = useState<Set<number>>(new Set())
  const [solution, setSolution] = useState<Set<number>>(new Set())
  const [done, setDone] = useState<Set<number>>(new Set())

  function toggle(set: Set<number>, i: number, setter: (s: Set<number>) => void) {
    const next = new Set(set)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    setter(next)
    haptic(5)
  }

  return (
    <Card data-lecture-exercises="" className="gap-3 border-[#84D8FF] bg-[#EEF9FF] shadow-[0_2px_0_#84D8FF] overflow-visible">
      <div className="flex items-center gap-2">
        <span className="w-9 h-9 rounded-full bg-[#DDF4FF] text-secondary flex items-center justify-center flex-shrink-0"><PencilLine className="w-5 h-5" strokeWidth={2.6} /></span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-extrabold leading-[1.3] text-heading">Zadaci za vježbu</h3>
          <p className="text-[12px] font-bold text-muted-foreground">Prvo pokušaj sam, pa provjeri rješenje · {done.size}/{exercises.length}</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {exercises.map((e, i) => {
          const isDone = done.has(i)
          return (
            <div key={i} className={`rounded-2xl border-2 bg-card px-3.5 py-3 space-y-2 ${isDone ? 'border-[#B8F28B]' : 'border-border'}`}>
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  aria-pressed={isDone}
                  aria-label={isDone ? 'Označi kao neriješeno' : 'Označi kao riješeno'}
                  onClick={() => {
                    toggle(done, i, setDone)
                    if (!isDone) track('lecture_read', { entity_id: lectureId, meta: { exercise: i + 1 } })
                  }}
                  className={`mt-0.5 w-9 h-9 rounded-full border-[3px] flex items-center justify-center flex-shrink-0 transition-[transform,background-color] duration-[80ms] active:scale-90 ${isDone ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-background text-transparent'}`}
                >
                  <Check className="w-5 h-5" strokeWidth={3.2} />
                </button>
                <p className={`flex-1 text-[15px] leading-[1.55] font-bold whitespace-pre-wrap ${isDone ? 'text-muted-foreground' : 'text-foreground'}`}>
                  <span className="text-secondary font-extrabold">{i + 1}. </span>{formatMath(e.task)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pl-12">
                {e.hint && (
                  <button type="button" onClick={() => toggle(hint, i, setHint)} className={`inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border-2 text-[12px] font-extrabold uppercase tracking-[0.04em] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none ${hint.has(i) ? 'border-[#FFE28A] bg-[#FFF4C4] text-[#C79000]' : 'border-border bg-background text-muted-foreground shadow-[0_2px_0_var(--color-border)]'}`}>
                    <Lightbulb className="w-4 h-4" strokeWidth={2.6} /> {hint.has(i) ? 'Sakrij savjet' : 'Savjet'}
                  </button>
                )}
                <button type="button" onClick={() => toggle(solution, i, setSolution)} className={`inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border-2 text-[12px] font-extrabold uppercase tracking-[0.04em] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none ${solution.has(i) ? 'border-[#B8F28B] bg-[#F1FBE8] text-[#3E8A00]' : 'border-border bg-background text-muted-foreground shadow-[0_2px_0_var(--color-border)]'}`}>
                  <Eye className="w-4 h-4" strokeWidth={2.6} /> {solution.has(i) ? 'Sakrij rješenje' : 'Rješenje'}
                </button>
              </div>
              {hint.has(i) && e.hint && (
                <p className="ml-12 rounded-xl bg-[#FFF9E0] border-2 border-[#FFE28A] px-3 py-2 text-[14px] leading-[1.5] font-bold text-heading whitespace-pre-wrap animate-fade-in">{formatMath(e.hint)}</p>
              )}
              {solution.has(i) && (
                <p className="ml-12 rounded-xl bg-[#F4FFEA] border-2 border-[#B8F28B] px-3 py-2 text-[14px] leading-[1.55] font-bold text-heading whitespace-pre-wrap animate-fade-in">{formatMath(e.solution)}</p>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
