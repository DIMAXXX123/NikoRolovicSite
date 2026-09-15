'use client'

import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import type { SkolaPeriod, SkolaStats } from '@/lib/skola-types'
import { useApi } from '../../direktor/_lib/direktor-client'
import { ErrorCard, KpiSkeletonGrid } from '../../nastavnik/_components/widgets'
import { usePanel } from '../../_shared/panel-shell'

export const SKOLA_PERIOD_LABELS: Record<SkolaPeriod, string> = {
  '7d': '7 dana',
  '30d': '30 dana',
  semester: 'Polugodište',
  year: 'Škol. godina',
  prev_year: 'Prošla godina',
}

export interface SkolaFilters {
  class?: number | null
  section?: number | null
  subject?: string | null
}

export function useSkolaStats(filters: SkolaFilters = {}) {
  const { period } = usePanel<SkolaPeriod>()
  const p = new URLSearchParams({ period })
  if (filters.class) p.set('class', String(filters.class))
  if (filters.section) p.set('section', String(filters.section))
  if (filters.subject) p.set('subject', filters.subject)
  return { ...useApi<SkolaStats>(`/api/skola/stats?${p.toString()}`), period }
}

/** Loads skola_stats for the current period and hands it to the screen. */
export function SkolaPage({ filters = {}, skeleton, children }: { filters?: SkolaFilters; skeleton?: ReactNode; children: (s: SkolaStats) => ReactNode }) {
  const { data, error, loading, refetch } = useSkolaStats(filters)
  if (error && !data) return <ErrorCard message={error.message} onRetry={() => void refetch()} />
  if (loading || !data) return <>{skeleton ?? <KpiSkeletonGrid n={4} />}</>
  return (
    <div className="space-y-5">
      <SourceLine meta={data.meta} />
      {children(data)}
    </div>
  )
}

/** Where the marks come from — honest about demo data. */
export function SourceLine({ meta }: { meta: SkolaStats['meta'] }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5 -mt-1">
      {meta.ednevnik_students > 0 && <Badge variant="secondary">eDnevnik · {meta.ednevnik_students}</Badge>}
      {meta.manual_rows > 0 && <Badge variant="outline">ručni unos</Badge>}
      {meta.seed_share > 50 && <Badge variant="gold">Demo podaci</Badge>}
    </div>
  )
}

/** Grade 1–5 → colour. */
export function gradeColor(v: number | null | undefined): string {
  if (v === null || v === undefined) return '#AFAFAF'
  if (v < 2.5) return '#FF4B4B'
  if (v < 3.5) return '#FFC800'
  return '#58CC02'
}

export function fmtGrade(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : v.toFixed(2).replace('.', ',')
}

export function fmtDelta(cur: number | null | undefined, prev: number | null | undefined): string | null {
  if (cur === null || cur === undefined || prev === null || prev === undefined) return null
  const d = cur - prev
  if (Math.abs(d) < 0.005) return '±0'
  return `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(2).replace('.', ',')}`
}
