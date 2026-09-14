'use client'

import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import type { NastavnikStats } from '@/lib/direktor-types'
import { useNastavnikShell } from '../_lib/context'
import { useNastavnikStats } from '../_lib/use-stats'
import { DemoBadge, ErrorCard, PeriodChips } from './widgets'

/**
 * Common top of every tab: title, DEMO badge, fallback-author note, period
 * chips, and the loading / error branches. `children` gets the loaded stats.
 */
export function PanelPage({
  title,
  subtitle,
  skeleton,
  children,
  hidePeriod,
}: {
  title: string
  subtitle?: string
  skeleton: ReactNode
  children: (stats: NastavnikStats) => ReactNode
  hidePeriod?: boolean
}) {
  const { period, setPeriod, author } = useNastavnikShell()
  const { data, error, loading, refresh } = useNastavnikStats(period, author)

  return (
    <div className="space-y-4 pb-4">
      <div className="pt-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-[26px] leading-[1.2] font-extrabold tracking-[-0.01em] text-heading">{title}</h1>
          <DemoBadge share={data?.meta.demo_share} />
        </div>
        {subtitle && <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground">{subtitle}</p>}
        {data?.meta.author && (
          <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <span className="truncate">{data.meta.author.name}</span>
            {data.meta.author.subject && <span>· {data.meta.author.subject}</span>}
            {data.meta.fallback_author && (
              <Badge variant="outline" className="normal-case tracking-normal h-auto py-0.5 whitespace-normal text-left">
                Demo nalog nema lekcija — prikazan je autor sa najviše lekcija
              </Badge>
            )}
          </p>
        )}
      </div>

      {!hidePeriod && <PeriodChips value={period} onChange={setPeriod} />}

      {error && !data ? (
        <ErrorCard message={error} onRetry={() => void refresh()} />
      ) : loading || !data ? (
        skeleton
      ) : (
        children(data)
      )}
    </div>
  )
}
