'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { DirektorStats } from '@/lib/direktor-types'
import { DemoBadge, ErrorCard, KpiSkeletonGrid } from '../../nastavnik/_components/widgets'
import { useDirektorStats, type StatsFilters } from '../_lib/direktor-client'

/** Loads direktor_stats for the current period and hands the JSON to the screen. */
export function StatsPage({
  filters = {},
  skeleton,
  children,
}: {
  filters?: StatsFilters
  skeleton?: ReactNode
  children: (s: DirektorStats) => ReactNode
}) {
  const { data, error, loading, refetch } = useDirektorStats(filters)
  if (error && !data) return <ErrorCard message={error.message} onRetry={() => void refetch()} />
  if (loading || !data) return <>{skeleton ?? <KpiSkeletonGrid n={6} />}</>
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end gap-2 -mt-1">
        <DemoBadge share={data.meta.demo_share} />
      </div>
      {children(data)}
    </div>
  )
}

/** Health ring 0–100. */
export function HealthRing({ score, size = 96 }: { score: number | null; size?: number }) {
  const v = score ?? 0
  const r = (size - 12) / 2
  const c = 2 * Math.PI * r
  const color = v >= 70 ? '#58CC02' : v >= 45 ? '#FFC800' : '#FF4B4B'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Zdravlje škole ${score ?? '—'}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E5E5" strokeWidth={12} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${(c * v) / 100} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size * 0.3} fontWeight={900} fill="#3C3C3C" fontFamily="inherit">{score ?? '—'}</text>
    </svg>
  )
}

/** Horizontal bars, sorted by the caller. */
export function Bars({ rows, max, color = '#1CB0F6', format }: { rows: { label: string; value: number | null; href?: string; sub?: string }[]; max?: number; color?: string; format: (v: number | null) => string }) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value ?? 0))
  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const body = (
          <div className="min-h-11 flex flex-col justify-center gap-1">
            <div className="flex items-center justify-between gap-2 text-[13px] font-extrabold">
              <span className="truncate text-heading">{r.label}{r.sub && <span className="text-muted-foreground font-bold"> · {r.sub}</span>}</span>
              <span className="tabular-nums text-heading">{format(r.value)}</span>
            </div>
            <div className="h-3 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${r.value === null ? 0 : Math.min(100, ((r.value ?? 0) / top) * 100)}%`, background: color }} />
            </div>
          </div>
        )
        return r.href ? <Link key={r.label} href={r.href} className="block">{body}</Link> : <div key={r.label}>{body}</div>
      })}
    </div>
  )
}

/** Compact AI summary card for the Pregled screen. */
export function AiCard({ ai }: { ai: DirektorStats['ai'] }) {
  const latest = ai.latest
  const verdict = latest?.output.health_verdict
  const dot = verdict === 'dobro' ? '#58CC02' : verdict === 'pažnja' ? '#FFC800' : verdict === 'problem' ? '#FF4B4B' : '#AFAFAF'
  return (
    <Link href="/direktor/ai" className="block">
      <Card className="gap-3 border-[#E1BDFF] bg-[#F9F3FF] shadow-[0_2px_0_#E1BDFF] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none">
        <div className="flex items-center gap-2">
          <span className="w-11 h-11 rounded-full bg-[#F3E3FF] text-accent-dark flex items-center justify-center flex-shrink-0"><Sparkles className="w-5 h-5" strokeWidth={2.6} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-extrabold text-heading">AI analiza {latest ? 'dana' : ''}</span>
            <span className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full" style={{ background: dot }} />{verdict ?? (ai.pending > 0 ? 'u pripremi' : 'nema izvještaja')}</span>
          </span>
          {ai.pending > 0 && <Badge variant="secondary">{ai.pending} u redu</Badge>}
        </div>
        {latest ? (
          <p className="text-[15px] leading-[1.5] font-bold text-foreground line-clamp-4">{latest.output.summary}</p>
        ) : (
          <p className="text-[13px] font-bold text-muted-foreground">Pokreni analizu — AI čita samo agregate, bez imena.</p>
        )}
        <span className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-accent-dark">Pročitaj analizu →</span>
      </Card>
    </Link>
  )
}

/** 7×24 heatmap from CSS grid cells. */
export function HeatmapGrid({ heatmap }: { heatmap: DirektorStats['heatmap'] }) {
  const days = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned']
  const lookup = new Map(heatmap.cells.map((c) => [`${c.weekday}-${c.hour}`, c.events]))
  const max = Math.max(1, heatmap.max)
  return (
    <div className="space-y-2">
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: '28px repeat(24, minmax(0, 1fr))' }}>
        {days.map((d, wi) => (
          <div key={d} className="contents">
            <span className="text-[10px] leading-none font-extrabold text-muted-foreground flex items-center">{d}</span>
            {Array.from({ length: 24 }, (_, h) => {
              const v = lookup.get(`${wi + 1}-${h}`) ?? lookup.get(`${wi}-${h}`) ?? 0
              const a = v === 0 ? 0.06 : 0.15 + 0.85 * (v / max)
              return <span key={h} className="aspect-square rounded-[3px]" style={{ background: `rgba(28,176,246,${a.toFixed(2)})` }} title={`${d} ${h}:00 — ${v}`} />
            })}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] font-extrabold text-muted-foreground pl-7"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span></div>
      {heatmap.peak && <p className="text-[13px] font-bold text-muted-foreground">Vrhunac: {days[(heatmap.peak.weekday + 6) % 7]} {heatmap.peak.hour_from}–{heatmap.peak.hour_to}h</p>}
    </div>
  )
}
