'use client'

import { useCallback, useEffect, useState } from 'react'
import type { DirektorPeriod, NastavnikStats } from '@/lib/direktor-types'

/**
 * SWR-like fetch for GET /api/nastavnik/stats: one module-level cache keyed by
 * the query string, shared by the four tabs so switching tabs never refetches.
 * Entries older than TTL are refreshed in the background (stale-while-revalidate).
 */
interface Entry {
  data: NastavnikStats | null
  error: string | null
  ts: number
  promise: Promise<void> | null
}

const TTL_MS = 5 * 60 * 1000
const cache = new Map<string, Entry>()
const listeners = new Map<string, Set<() => void>>()

function notify(key: string) {
  listeners.get(key)?.forEach((fn) => fn())
}

async function load(key: string, url: string, force: boolean): Promise<void> {
  const entry = cache.get(key) ?? { data: null, error: null, ts: 0, promise: null }
  if (entry.promise) return entry.promise
  if (!force && entry.data && Date.now() - entry.ts < TTL_MS) return
  const promise = (async () => {
    try {
      const res = await fetch(url, { credentials: 'same-origin' })
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const j = (await res.json()) as { error?: string }
          if (j?.error) msg = j.error
        } catch {}
        cache.set(key, { data: entry.data, error: msg, ts: Date.now(), promise: null })
      } else {
        const json = (await res.json()) as NastavnikStats
        cache.set(key, { data: json, error: null, ts: Date.now(), promise: null })
      }
    } catch (err) {
      cache.set(key, { data: entry.data, error: err instanceof Error ? err.message : 'Greška', ts: Date.now(), promise: null })
    }
    notify(key)
  })()
  cache.set(key, { ...entry, promise })
  return promise
}

export function statsKey(period: DirektorPeriod, author: string | null): string {
  const p = new URLSearchParams({ period })
  if (author) p.set('author', author)
  return p.toString()
}

export function useNastavnikStats(period: DirektorPeriod, author: string | null) {
  const key = statsKey(period, author)
  const url = `/api/nastavnik/stats?${key}`
  const [, force] = useState(0)
  const rerender = useCallback(() => force((n) => n + 1), [])

  useEffect(() => {
    let set = listeners.get(key)
    if (!set) {
      set = new Set()
      listeners.set(key, set)
    }
    set.add(rerender)
    void load(key, url, false)
    return () => {
      set?.delete(rerender)
    }
  }, [key, url, rerender])

  const entry = cache.get(key)
  const refresh = useCallback(() => load(key, url, true), [key, url])
  return {
    data: entry?.data ?? null,
    error: entry?.error ?? null,
    loading: !entry?.data && !entry?.error,
    refresh,
  }
}
