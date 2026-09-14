'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { DirektorPeriod, DirektorStats } from '@/lib/direktor-types'

/**
 * Client-side plumbing of the /direktor panel: the selected period (shared by
 * every tab through context + localStorage) and a tiny SWR-like fetcher with a
 * module-level cache keyed by the request URL. Aggregates come only from the
 * API routes — nothing is computed from raw events here.
 */

export const PERIOD_LABELS: Record<DirektorPeriod, string> = {
  today: 'Danas',
  '7d': '7 dana',
  '30d': '30 dana',
  semester: 'Polugodište',
}

const PERIOD_KEY = 'direktor_period'
const CACHE_TTL_MS = 5 * 60 * 1000

interface PeriodContextValue {
  period: DirektorPeriod
  setPeriod: (p: DirektorPeriod) => void
}

const PeriodContext = createContext<PeriodContextValue>({ period: '7d', setPeriod: () => {} })

export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriodState] = useState<DirektorPeriod>('7d')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PERIOD_KEY)
      if (saved === 'today' || saved === '7d' || saved === '30d' || saved === 'semester') setPeriodState(saved)
    } catch {
      /* private mode */
    }
  }, [])

  const setPeriod = useCallback((p: DirektorPeriod) => {
    setPeriodState(p)
    try {
      localStorage.setItem(PERIOD_KEY, p)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(() => ({ period, setPeriod }), [period, setPeriod])
  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
}

export function usePeriod() {
  return useContext(PeriodContext)
}

// ---------------------------------------------------------------------------
// Fetch cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: unknown
  ts: number
}

const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<unknown>>()

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'error' in body) {
    const e = (body as { error: unknown }).error
    if (typeof e === 'string') return e
  }
  return `HTTP ${status}`
}

export async function apiGet<T>(url: string, force = false): Promise<T> {
  if (!force) {
    const hit = cache.get(url)
    if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return hit.data as T
    const pending = inflight.get(url)
    if (pending) return pending as Promise<T>
  }
  const p = (async () => {
    const res = await fetch(url, { credentials: 'same-origin', cache: 'no-store' })
    let body: unknown = null
    try {
      body = await res.json()
    } catch {
      body = null
    }
    if (!res.ok) throw new ApiError(res.status, errorMessage(body, res.status), body)
    cache.set(url, { data: body, ts: Date.now() })
    return body as T
  })()
  inflight.set(url, p)
  try {
    return await p
  } finally {
    inflight.delete(url)
  }
}

export async function apiPost<T>(url: string, body: unknown): Promise<{ status: number; data: T }> {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, res.status), data)
  return { status: res.status, data: data as T }
}

/** Drop cached GET responses whose URL starts with `prefix` (after a mutation). */
export function invalidate(prefix: string) {
  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}

export interface UseApiResult<T> {
  data: T | null
  error: ApiError | null
  loading: boolean
  refetch: () => Promise<void>
}

export function useApi<T>(url: string | null): UseApiResult<T> {
  const [data, setData] = useState<T | null>(() => {
    if (!url) return null
    const hit = cache.get(url)
    return hit ? (hit.data as T) : null
  })
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState<boolean>(() => !!url && !cache.get(url))
  const urlRef = useRef(url)
  urlRef.current = url

  const load = useCallback(async (force: boolean) => {
    const target = urlRef.current
    if (!target) {
      setData(null)
      setLoading(false)
      return
    }
    const hit = cache.get(target)
    if (!force && hit && Date.now() - hit.ts < CACHE_TTL_MS) {
      setData(hit.data as T)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const result = await apiGet<T>(target, force)
      if (urlRef.current === target) {
        setData(result)
        setError(null)
      }
    } catch (e) {
      if (urlRef.current === target) {
        setError(e instanceof ApiError ? e : new ApiError(0, (e as Error).message))
      }
    } finally {
      if (urlRef.current === target) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(false)
  }, [url, load])

  const refetch = useCallback(() => load(true), [load])

  return { data, error, loading, refetch }
}

export interface StatsFilters {
  class?: number | null
  section?: number | null
  subject?: string | null
}

export function statsQuery(period: DirektorPeriod, f: StatsFilters = {}): string {
  const p = new URLSearchParams({ period })
  if (f.class) p.set('class', String(f.class))
  if (f.section) p.set('section', String(f.section))
  if (f.subject) p.set('subject', f.subject)
  return p.toString()
}

/** Stats for the current period (+ optional class/section/subject filter). */
export function useDirektorStats(filters: StatsFilters = {}) {
  const { period } = usePeriod()
  const url = `/api/direktor/stats?${statsQuery(period, filters)}`
  return { ...useApi<DirektorStats>(url), period }
}

// ---------------------------------------------------------------------------
// Formatting helpers (Montenegrin locale)
// ---------------------------------------------------------------------------

const numFmt = new Intl.NumberFormat('sr-Latn-ME', { maximumFractionDigits: 1 })
const intFmt = new Intl.NumberFormat('sr-Latn-ME', { maximumFractionDigits: 0 })

export function fmtNum(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return digits === 0 ? intFmt.format(v) : numFmt.format(v)
}

export function fmtInt(v: number | null | undefined): string {
  return fmtNum(v, 0)
}

export function fmtPct(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return `${fmtNum(v, digits)}%`
}

export function fmtSecs(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  const s = Math.round(v)
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  const rest = s % 60
  if (m < 60) return rest ? `${m} min ${rest} s` : `${m} min`
  const h = Math.floor(m / 60)
  return `${h} h ${m % 60} min`
}

export function fmtHours(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  if (v < 1) return `${Math.round(v * 60)} min`
  if (v < 48) return `${fmtNum(v, 1)} h`
  return `${fmtNum(v / 24, 1)} d`
}

export function fmtDate(
  iso: string | null | undefined,
  opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('sr-Latn-ME', { ...opts, timeZone: 'Europe/Podgorica' }).format(d)
}

export function fmtDateTime(iso: string | null | undefined): string {
  return fmtDate(iso, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function fmtDateLong(iso: string | null | undefined): string {
  return fmtDate(iso, { day: 'numeric', month: 'long', year: 'numeric' })
}

export const WEEKDAYS_SHORT = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned']
export const WEEKDAYS_LONG = ['ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota', 'nedjelja']

export const COLORS = {
  green: '#58CC02',
  greenText: '#58A700',
  blue: '#1CB0F6',
  purple: '#CE82FF',
  gold: '#FFC800',
  red: '#FF4B4B',
  grey: '#E5E5E5',
  muted: '#777777',
  disabled: '#AFAFAF',
} as const

const SUBJECT_COLORS: Record<string, string> = {
  Fizika: '#1CB0F6',
  Matematika: '#58CC02',
  CSBH: '#FF4B4B',
  Hemija: '#CE82FF',
  Engleski: '#1CB0F6',
  Italjanski: '#58CC02',
  Fizicko: '#FF9600',
  Likovno: '#FF86D0',
  Biologija: '#58CC02',
  Istorija: '#FFC800',
  Geografija: '#1CB0F6',
  Njemacki: '#FFC800',
  Spanski: '#FF9600',
  Izb_spanski: '#FF9600',
}

export function subjectColor(subject: string): string {
  return SUBJECT_COLORS[subject] ?? '#1CB0F6'
}

/** Score colour: < 50 red, < 70 gold, else green. */
export function scoreColor(v: number | null | undefined): string {
  if (v === null || v === undefined) return COLORS.disabled
  if (v < 50) return COLORS.red
  if (v < 70) return COLORS.gold
  return COLORS.green
}

export const K_HIDDEN_TEXT = 'Premalo podataka (zaštita privatnosti)'
export const DISCLAIMER_TEXT = 'AI analiza agregiranih podataka. Provjerite prije odluke.'
