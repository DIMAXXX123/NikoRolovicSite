'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { StatsPage } from '../../_components/blocks'
import { LearningView } from '../learning-view'

export default function DirektorUcenjePredmet() {
  const { subject: raw } = useParams<{ subject: string }>()
  const subject = decodeURIComponent(raw)
  return (
    <div className="space-y-4">
      <Link href="/direktor/ucenje" className="inline-flex items-center gap-1 h-11 text-[13px] font-extrabold uppercase tracking-[0.04em] text-secondary">
        <ChevronLeft className="w-5 h-5" strokeWidth={2.6} /> Svi predmeti
      </Link>
      <h2 className="text-[26px] leading-[1.2] font-extrabold tracking-[-0.01em] text-heading">{subject}</h2>
      <StatsPage filters={{ subject }}>{(s) => <LearningView s={s} subject={subject} />}</StatsPage>
    </div>
  )
}
