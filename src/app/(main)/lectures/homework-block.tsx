import Link from 'next/link'
import { ClipboardList, ChevronRight, Plus } from 'lucide-react'
import type { Homework } from './lecture-utils'
import { DEFAULT_SUBJECTS, OPTIONAL_SUBJECTS } from './subjects'
import { SubjectIcon } from './subject-icon'

export interface HomeworkItem {
  lectureId: string
  subject: string
  title: string
  homework: Homework
}

function formatDue(due: string | null): string | null {
  if (!due) return null
  const [y, m, d] = due.split('-').map(Number)
  if (!y || !m || !d) return null
  return `${d}. ${m}.`
}

/** The full-width "Domaći" block on the Lekcije screen: the current homework across subjects. */
export function HomeworkBlock({ items }: { items: HomeworkItem[] }) {
  const subjects = [...DEFAULT_SUBJECTS, ...OPTIONAL_SUBJECTS]
  return (
    <section
      aria-label="Domaći"
      className="rounded-2xl border-2 border-[#FFE28A] bg-[#FFF9E0] shadow-[0_2px_0_#FFE28A] p-4 space-y-3"
    >
      <Link href="/domaci" className="flex items-center gap-3 min-h-11 rounded-xl">
        <span className="w-11 h-11 rounded-full bg-[#FFF4C4] border-2 border-[#FFE28A] text-[#C79000] flex items-center justify-center flex-shrink-0">
          <ClipboardList className="w-5 h-5" strokeWidth={2.6} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[20px] leading-[1.25] font-extrabold text-heading">Domaći</span>
          <span className="block text-[13px] leading-[1.4] font-bold text-muted-foreground">
            {items.length === 0 ? 'Nema domaćih zadataka' : `${items.length} ${items.length === 1 ? 'aktivan zadatak' : 'aktivna zadatka'} za tvoj razred`}
          </span>
        </span>
        <ChevronRight className="w-5 h-5 text-[#C79000] flex-shrink-0" strokeWidth={2.6} />
      </Link>

      {items.length > 0 && (
        <div className="space-y-2.5">
          {items.slice(0, 3).map((item) => {
            const info = subjects.find((s) => s.name === item.subject)
            const due = formatDue(item.homework.due)
            const firstTask = item.homework.tasks[0]
            const image = item.homework.images[0]
            return (
              <Link
                key={item.lectureId}
                href={`/domaci/${item.lectureId}`}
                className="flex items-center gap-3 min-h-16 p-3 rounded-2xl border-2 border-[#FFE28A] bg-card shadow-[0_2px_0_#FFE28A] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none"
              >
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="w-14 h-14 rounded-xl object-cover border-2 border-[#FFE28A] flex-shrink-0" />
                ) : info ? (
                  <SubjectIcon name={info.name} emoji={info.emoji} size="sm" />
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[12px] leading-none font-extrabold uppercase tracking-[0.04em] text-[#C79000]">{item.subject}</span>
                    {due && (
                      <span className="text-[11px] leading-none font-extrabold uppercase tracking-[0.06em] px-2 py-1 rounded-full border-2 border-[#FFE28A] bg-[#FFF4C4] text-[#C79000]">
                        Rok: {due}
                      </span>
                    )}
                  </span>
                  <span className="block mt-1 text-[15px] leading-[1.3] font-extrabold text-heading truncate">{item.title}</span>
                  <span className="block mt-0.5 text-[13px] leading-[1.4] font-bold text-muted-foreground line-clamp-2">
                    {firstTask ? `${firstTask.label}: ${firstTask.what}` : item.homework.text}
                  </span>
                </span>
                <ChevronRight className="w-5 h-5 text-disabled flex-shrink-0" strokeWidth={2.6} />
              </Link>
            )
          })}
        </div>
      )}

      {items.length === 0 ? (
        <Link
          href="/lectures/nova"
          className="flex items-center justify-center gap-2 h-[50px] rounded-2xl bg-[#FFC800] text-[#4B4B4B] text-[15px] font-extrabold uppercase tracking-[0.04em] shadow-[0_4px_0_#E5A800] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[4px] active:shadow-none"
        >
          <Plus className="w-5 h-5" strokeWidth={2.8} /> Dodaj domaći
        </Link>
      ) : (
        <Link
          href="/domaci"
          className="flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-[#FFE28A] bg-card text-[#C79000] text-[12px] font-extrabold uppercase tracking-[0.04em] shadow-[0_2px_0_#FFE28A] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none"
        >
          Svi domaći <ChevronRight className="w-4 h-4" strokeWidth={2.8} />
        </Link>
      )}
    </section>
  )
}
