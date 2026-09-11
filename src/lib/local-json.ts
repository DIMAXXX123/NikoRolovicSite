'use client'

import { useSyncExternalStore } from 'react'

const listeners = new Set<() => void>()
const cache = new Map<string, { raw: string | null; value: unknown }>()

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  // `storage` only fires in *other* tabs; writeLocalJson covers this one.
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

/**
 * Read a JSON value out of localStorage as a React store.
 *
 * On the server (and on the first client render, so hydration matches) this
 * returns `fallback`; the stored value arrives right after. `fallback` must be
 * a stable reference — use a module-level constant.
 */
export function useLocalJson<T>(key: string, fallback: T): T {
  return useSyncExternalStore(
    subscribe,
    () => {
      const raw = localStorage.getItem(key)
      const hit = cache.get(key)
      // useSyncExternalStore needs a referentially stable snapshot.
      if (hit && hit.raw === raw) return hit.value as T
      let value = fallback
      if (raw) {
        try {
          value = JSON.parse(raw) as T
        } catch {
          value = fallback
        }
      }
      cache.set(key, { raw, value })
      return value
    },
    () => fallback
  )
}

export function writeLocalJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
  listeners.forEach((listener) => listener())
}
