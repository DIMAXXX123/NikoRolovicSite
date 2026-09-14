import Link from 'next/link'
import { ClipboardList, ChevronRight } from 'lucide-react'
import type { Homework } from './lecture-utils'

export interface HomeworkItem {
  lectureId: string
  subject: string
  title: string
  homework: Homework
}

/**
 * The "Domaći zadatak" entry on the Lekcije screen — one banner, same shape as
 * "Nova lekcija sa AI". The homework itself lives on /domaci.
 */
export function HomeworkBlock({ items }: { items: HomeworkItem[] }) {
  const n = items.length
  const subtitle =
    n === 0
      ? 'Nema aktivnih zadataka'
      : `${n} ${n === 1 ? 'aktivan zadatak' : n < 5 ? 'aktivna zadatka' : 'aktivnih zadataka'} · pogledaj`
  return (
    <Link
      href="/domaci"
      className="flex items-center gap-3 min-h-16 px-4 py-3 rounded-2xl border-2 border-[#FFE28A] bg-[#FFF9E0] shadow-[0_2px_0_#FFE28A] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none"
    >
      <span className="w-11 h-11 rounded-full bg-[#FFC800] text-[#4B4B4B] flex items-center justify-center flex-shrink-0 shadow-[0_3px_0_#E5A800]">
        <ClipboardList className="w-5 h-5" strokeWidth={2.6} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] leading-[1.3] font-extrabold text-heading">Domaći zadatak</span>
        <span className="block text-[13px] leading-[1.4] font-bold text-muted-foreground">{subtitle}</span>
      </span>
      {n > 0 && (
        <span className="min-w-7 h-7 px-2 rounded-full bg-[#FFC800] text-[#4B4B4B] text-[13px] font-extrabold flex items-center justify-center shadow-[0_2px_0_#E5A800]">
          {n}
        </span>
      )}
      <ChevronRight className="w-5 h-5 text-[#C79000] flex-shrink-0" strokeWidth={2.6} />
    </Link>
  )
}
