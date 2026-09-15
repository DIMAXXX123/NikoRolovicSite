'use client'

import type { ReactNode } from 'react'
import type { DirektorPeriod, DirektorStats } from '@/lib/direktor-types'
import { statsQuery, useApi } from '../../direktor/_lib/direktor-client'
import { DemoBadge, ErrorCard, KpiSkeletonGrid } from '../../nastavnik/_components/widgets'
import { usePanel } from '../../_shared/panel-shell'

export function useAppStats() {
  const { period } = usePanel<DirektorPeriod>()
  return { ...useApi<DirektorStats>(`/api/direktor/stats?${statsQuery(period)}`), period }
}

/** Loads the app statistics for the current period and hands them to the screen. */
export function AppPage({ skeleton, children }: { skeleton?: ReactNode; children: (s: DirektorStats) => ReactNode }) {
  const { data, error, loading, refetch } = useAppStats()
  if (error && !data) return <ErrorCard message={error.message} onRetry={() => void refetch()} />
  if (loading || !data) return <>{skeleton ?? <KpiSkeletonGrid n={4} />}</>
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end gap-2 -mt-1">
        <DemoBadge share={data.meta.demo_share} />
      </div>
      {children(data)}
    </div>
  )
}
