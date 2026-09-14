import type { DirektorPeriod } from '@/lib/direktor-types'

export const PERIOD_LABELS: Record<DirektorPeriod, string> = {
  today: 'Danas',
  '7d': '7 dana',
  '30d': '30 dana',
  semester: 'Polugodište',
}

export const PRIVACY_TEXT = 'Premalo podataka (zaštita privatnosti)'

export function fmtNum(v: number | null | undefined, digits = 0): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return v.toLocaleString('sr-Latn', { maximumFractionDigits: digits, minimumFractionDigits: 0 })
}

export function fmtPct(v: number | null | undefined, digits = 0): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return `${fmtNum(v, digits)}%`
}

/** Hours → "3 h" / "1,5 d". */
export function fmtHours(h: number | null | undefined): string {
  if (h === null || h === undefined || Number.isNaN(h)) return '—'
  if (h < 1) return `${Math.round(h * 60)} min`
  if (h < 48) return `${fmtNum(h, 1)} h`
  return `${fmtNum(h / 24, 1)} d`
}

export function fmtSeconds(s: number | null | undefined): string {
  if (s === null || s === undefined || Number.isNaN(s)) return '—'
  if (s < 60) return `${Math.round(s)} s`
  return `${Math.round(s / 60)} min`
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function daysAgo(iso: string | null | undefined): number | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000))
}

/** Signal links from SQL that point at routes this app spells differently. */
export function resolveSignalLink(link: string | null): string | null {
  if (!link) return null
  if (link === '/admin/gallery') return '/admin/photos'
  return link
}

export function lectureHref(subject: string, id: string): string {
  return `/lectures/${encodeURIComponent(subject)}/${id}`
}
