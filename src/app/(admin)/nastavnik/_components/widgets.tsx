'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { AlertTriangle, ChevronRight, Info, Inbox, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DIREKTOR_PERIODS, type DirektorPeriod, type Kpi, type Signal } from '@/lib/direktor-types'
import { PERIOD_LABELS, fmtNum, resolveSignalLink } from '../_lib/format'

// ---------------------------------------------------------------------------
// Chips (§4.8) — 44px period switcher and sort pills.
// ---------------------------------------------------------------------------

export const CHIP_CLASS =
  'inline-flex items-center justify-center h-11 px-3.5 rounded-xl border-2 text-[12px] font-extrabold uppercase tracking-[0.04em] whitespace-nowrap select-none transition-[transform,box-shadow,background-color,border-color,color] duration-[80ms] active:translate-y-[2px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
export const CHIP_IDLE = 'bg-background border-border text-muted-foreground shadow-[0_2px_0_var(--color-border)]'
export const CHIP_ACTIVE = 'bg-[#DDF4FF] border-[#84D8FF] text-secondary shadow-[0_2px_0_#84D8FF]'

export function Chip({ active, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(CHIP_CLASS, active ? CHIP_ACTIVE : CHIP_IDLE, className)}
      {...props}
    />
  )
}

export function PeriodChips({ value, onChange }: { value: DirektorPeriod; onChange: (p: DirektorPeriod) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1" role="group" aria-label="Period">
      {DIREKTOR_PERIODS.map((p) => (
        <Chip key={p} active={p === value} onClick={() => onChange(p)}>
          {PERIOD_LABELS[p]}
        </Chip>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// "ⓘ" definition — one sentence, shown as a white tooltip card on tap (§4.13).
// ---------------------------------------------------------------------------

export function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('touchstart', onDoc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('touchstart', onDoc)
    }
  }, [open])

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-label="Objašnjenje"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="w-7 h-7 -m-1 rounded-full flex items-center justify-center text-disabled hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Info className="w-4 h-4" strokeWidth={2.6} />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute right-0 top-full mt-1 z-30 w-[220px] max-w-[70vw] rounded-2xl border-2 border-border bg-card p-3 text-[13px] leading-[1.4] font-extrabold text-foreground normal-case tracking-normal text-left shadow-[0_2px_0_var(--color-border)]"
        >
          {text}
        </span>
      )}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Sparkline — 30 daily points, inline SVG, no dependency.
// ---------------------------------------------------------------------------

export function Sparkline({ series, color = '#1CB0F6', height = 36, className }: { series: (number | null)[]; color?: string; height?: number; className?: string }) {
  const pts = series.map((v) => (v === null || v === undefined || Number.isNaN(v) ? null : v))
  const nums = pts.filter((v): v is number => v !== null)
  if (nums.length < 2) return <div className={cn('w-full', className)} style={{ height }} aria-hidden="true" />
  const max = Math.max(...nums)
  const min = Math.min(...nums)
  const span = max - min || 1
  const w = 100
  const h = 100
  const step = w / Math.max(1, pts.length - 1)
  const coords: string[] = []
  pts.forEach((v, i) => {
    if (v === null) return
    const x = (i * step).toFixed(1)
    const y = (h - 6 - ((v - min) / span) * (h - 12)).toFixed(1)
    coords.push(`${x},${y}`)
  })
  const first = coords[0].split(',')[0]
  const last = coords[coords.length - 1].split(',')[0]
  const area = [`M${first},${h}`, ...coords.map((c) => `L${c}`), `L${last},${h}Z`].join(' ')
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn('w-full block', className)}
      style={{ height }}
      aria-hidden="true"
    >
      <path d={area} fill={color} opacity={0.12} />
      <polyline points={coords.join(' ')} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// KPI tile (spec §3): number 28/800, label 13/700, ▲/▼ delta, sparkline.
// ---------------------------------------------------------------------------

export function Delta({ pct, suffix = '%', invert = false }: { pct: number | null | undefined; suffix?: string; invert?: boolean }) {
  if (pct === null || pct === undefined || Number.isNaN(pct)) {
    return <span className="text-[13px] font-extrabold text-disabled tabular-nums">—</span>
  }
  const up = pct > 0.05
  const down = pct < -0.05
  const good = invert ? down : up
  const bad = invert ? up : down
  const color = good ? '#58A700' : bad ? '#FF4B4B' : '#777777'
  const arrow = up ? '▲' : down ? '▼' : '—'
  return (
    <span className="text-[13px] font-extrabold tabular-nums" style={{ color }}>
      {arrow} {fmtNum(Math.abs(pct), 1)}
      {suffix}
    </span>
  )
}

export function KpiTile({
  label,
  value,
  kpi,
  info,
  color = '#1CB0F6',
  invert,
  href,
  hint,
}: {
  label: string
  /** Formatted number to show. */
  value: string
  kpi?: Kpi | null
  info?: string
  color?: string
  /** Lower is better (e.g. abandon rate). */
  invert?: boolean
  href?: string
  hint?: string
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-1">
        <span className="text-[13px] leading-[1.3] font-bold text-muted-foreground">{label}</span>
        {info && <InfoTip text={info} />}
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[28px] leading-none font-extrabold text-heading tabular-nums">{value}</span>
        {kpi && <Delta pct={kpi.delta_pct} invert={invert} />}
      </div>
      {kpi && kpi.series.length > 1 ? (
        <Sparkline series={kpi.series} color={color} />
      ) : hint ? (
        <span className="text-[13px] leading-[1.4] font-bold text-muted-foreground">{hint}</span>
      ) : null}
    </>
  )
  const cls = 'gap-2 p-3.5 min-w-0 overflow-visible'
  if (href) {
    return (
      <Link href={href} className="block min-w-0">
        <Card className={cn(cls, 'transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none')}>{body}</Card>
      </Link>
    )
  }
  return <Card className={cls}>{body}</Card>
}

// ---------------------------------------------------------------------------
// Section header, progress bar, badges.
// ---------------------------------------------------------------------------

export function SectionTitle({ children, info, action }: { children: ReactNode; info?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <h2 className="flex items-center gap-1.5 text-[20px] leading-[1.25] font-extrabold text-heading">
        {children}
        {info && <InfoTip text={info} />}
      </h2>
      {action}
    </div>
  )
}

export function ProgressBar({ pct, color = '#58CC02', className }: { pct: number | null; color?: string; className?: string }) {
  const v = pct === null ? 0 : Math.max(0, Math.min(100, pct))
  return (
    <div className={cn('h-4 w-full rounded-full bg-border overflow-hidden', className)} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full" style={{ width: `${v}%`, background: color, boxShadow: 'inset 0 4px 0 rgba(255,255,255,.3)' }} />
    </div>
  )
}

export function DemoBadge({ share }: { share: number | null | undefined }) {
  if (!share || share <= 50) return null
  return <Badge variant="gold">DEMO PODACI</Badge>
}

/** Small metric inside a list row. */
export function Metric({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' | 'muted' }) {
  const color = tone === 'good' ? '#58A700' : tone === 'bad' ? '#EA2B2B' : '#4B4B4B'
  return (
    <span className="inline-flex flex-col min-w-0">
      <span className="text-[15px] leading-none font-extrabold tabular-nums" style={{ color }}>
        {value}
      </span>
      <span className="mt-1 text-[11px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{label}</span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// Skeleton / empty / error states (§4.11, §4.12).
// ---------------------------------------------------------------------------

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />
}

export function KpiSkeletonGrid({ n = 6 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: n }).map((_, i) => (
        <Card key={i} className="gap-2 p-3.5">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-9 w-full" />
        </Card>
      ))}
    </div>
  )
}

export function RowSkeletons({ n = 4 }: { n?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: n }).map((_, i) => (
        <Card key={i} className="gap-2.5 p-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-8 w-full" />
        </Card>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, text, action }: { icon?: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-8 px-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-disabled">
        <Icon className="w-7 h-7" strokeWidth={2.4} />
      </div>
      <p className="text-[17px] leading-[1.3] font-extrabold text-foreground">{title}</p>
      {text && <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground max-w-[280px]">{text}</p>}
      {action}
    </div>
  )
}

export function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="items-center text-center gap-3">
      <div className="w-16 h-16 rounded-full bg-[#FFDFE0] flex items-center justify-center text-[#EA2B2B]">
        <AlertTriangle className="w-7 h-7" strokeWidth={2.4} />
      </div>
      <p className="text-[17px] leading-[1.3] font-extrabold text-foreground">Podaci se nisu učitali</p>
      <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Pokušaj ponovo
        </Button>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Signals list.
// ---------------------------------------------------------------------------

const SEVERITY_COLOR: Record<Signal['severity'], string> = {
  critical: '#FF4B4B',
  warn: '#FFC800',
  info: '#1CB0F6',
}

export function SignalList({ signals, limit }: { signals: Signal[]; limit?: number }) {
  const list = limit ? signals.slice(0, limit) : signals
  if (list.length === 0) {
    return (
      <Card className="gap-1 p-4">
        <p className="text-[15px] font-extrabold text-primary-text">Nema upozorenja</p>
        <p className="text-[13px] font-bold text-muted-foreground">Sve lekcije su u redu za izabrani period.</p>
      </Card>
    )
  }
  return (
    <div className="space-y-2.5">
      {list.map((s, i) => {
        const href = resolveSignalLink(s.link)
        const inner = (
          <>
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: SEVERITY_COLOR[s.severity] }} aria-hidden="true" />
            <span className="flex-1 min-w-0 text-[15px] leading-[1.35] font-extrabold text-heading">{s.text}</span>
            {href && <ChevronRight className="w-5 h-5 text-disabled flex-shrink-0" strokeWidth={2.6} />}
          </>
        )
        const cls = 'w-full min-h-14 px-4 py-3 flex items-center gap-3 rounded-2xl border-2 border-border bg-card shadow-[0_2px_0_var(--color-border)]'
        return href ? (
          <Link key={i} href={href} className={cn(cls, 'transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none')}>
            {inner}
          </Link>
        ) : (
          <div key={i} className={cls}>
            {inner}
          </div>
        )
      })}
    </div>
  )
}
