/**
 * Client telemetry for the Direktor / Nastavnik panels.
 * (Plain module, no 'use client': the API route imports APP_EVENTS from here
 * and every browser-only call is guarded by isBrowser().)
 *
 * `track(event, payload)` pushes into an in-memory buffer; the buffer is
 * flushed every 5 s, when the tab is hidden (`visibilitychange`) and on
 * `pagehide`, through `navigator.sendBeacon` to POST /api/track (falls back to
 * `fetch(..., { keepalive: true })`). Nothing here ever throws or blocks the
 * UI — analytics is a side channel, not a feature.
 *
 * The server stamps user_id / role / class / section from the session cookie,
 * so the client sends only what it knows: the event, an entity id, a subject,
 * a numeric value and a small meta object. Platform is 'pwa' | 'browser' and
 * the OS family comes from the user agent — never the full UA string.
 */

export const APP_EVENTS = [
  'app_open',
  'session_start',
  'session_end',
  'screen_view',
  'lecture_open',
  'lecture_read',
  'lecture_unread',
  'lecture_time',
  'quiz_start',
  'quiz_finish',
  'quiz_abandon',
  'flashcards_start',
  'flashcards_finish',
  'lecture_search',
  'news_view',
  'news_like',
  'event_view',
  'schedule_view',
  'grades_open',
  'grades_calc',
  'ednevnik_connect',
  'ednevnik_sync',
  'gallery_view',
  'photo_upload',
  'photo_like',
  'game_start',
  'game_over',
  'tournament_view',
  'share',
  'push_received',
  'push_opened',
  'install_prompt',
  'installed',
  'profile_settings',
  'nav_customized',
  'font_size_changed',
  'theme_changed',
  'homework_done',
] as const

export type AppEvent = (typeof APP_EVENTS)[number]

export interface TrackPayload {
  /** Lecture / news / event / photo uuid. */
  entity_id?: string | null
  /** Lectures only. */
  subject?: string | null
  /** Score %, seconds, count — whatever the event's number is. */
  value?: number | null
  meta?: Record<string, unknown>
}

export interface TrackedEvent extends TrackPayload {
  event: AppEvent
  /** Client timestamp (ms since epoch); the server clamps it to a sane window. */
  ts: number
}

export const TRACK_ENDPOINT = '/api/track'
export const MAX_BATCH = 50
const FLUSH_MS = 5000
const SESSION_KEY = 'nr_session_id'
const SESSION_T0_KEY = 'nr_session_t0'
const ONCE_PREFIX = 'nr_once:'

let buffer: TrackedEvent[] = []
let timer: ReturnType<typeof setInterval> | null = null
let listenersBound = false

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined'
}

function randomId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  } catch {
    // fall through
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Per-tab session id (sessionStorage). Created on first use. */
export function getSessionId(): string {
  if (!isBrowser()) return ''
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = randomId()
      sessionStorage.setItem(SESSION_KEY, id)
      sessionStorage.setItem(SESSION_T0_KEY, String(Date.now()))
    }
    return id
  } catch {
    return 'no-storage'
  }
}

/** Seconds since the session started (0 when unknown). */
export function sessionSeconds(): number {
  if (!isBrowser()) return 0
  try {
    const t0 = Number(sessionStorage.getItem(SESSION_T0_KEY) || 0)
    return t0 > 0 ? Math.max(0, Math.round((Date.now() - t0) / 1000)) : 0
  } catch {
    return 0
  }
}

/** True the first time `key` is seen in this tab session, false afterwards. */
export function firstTimeThisSession(key: string): boolean {
  if (!isBrowser()) return false
  try {
    const k = ONCE_PREFIX + key
    if (sessionStorage.getItem(k)) return false
    sessionStorage.setItem(k, '1')
    return true
  } catch {
    return true
  }
}

export function getPlatform(): 'pwa' | 'browser' {
  if (!isBrowser()) return 'browser'
  try {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    return standalone ? 'pwa' : 'browser'
  } catch {
    return 'browser'
  }
}

/** OS family only — the full user agent never leaves the device. */
export function getOsFamily(): string {
  if (!isBrowser()) return 'other'
  const ua = navigator.userAgent || ''
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  if (/Windows/i.test(ua)) return 'windows'
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macos'
  if (/CrOS/i.test(ua)) return 'chromeos'
  if (/Linux/i.test(ua)) return 'linux'
  return 'other'
}

function buildBody(events: TrackedEvent[]): string {
  return JSON.stringify({
    session_id: getSessionId(),
    platform: getPlatform(),
    os: getOsFamily(),
    events,
  })
}

function send(events: TrackedEvent[], useBeacon: boolean) {
  if (events.length === 0) return
  const body = buildBody(events)
  try {
    if (useBeacon && typeof navigator.sendBeacon === 'function') {
      const ok = navigator.sendBeacon(TRACK_ENDPOINT, new Blob([body], { type: 'application/json' }))
      if (ok) return
    }
    void fetch(TRACK_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'same-origin',
    }).catch(() => undefined)
  } catch {
    // Offline / blocked — drop the batch, never surface to the UI.
  }
}

/** Sends everything buffered so far. `useBeacon` is for unload paths. */
export function flush(useBeacon = false) {
  if (!isBrowser() || buffer.length === 0) return
  const pending = buffer
  buffer = []
  for (let i = 0; i < pending.length; i += MAX_BATCH) {
    send(pending.slice(i, i + MAX_BATCH), useBeacon)
  }
}

function ensureScheduler() {
  if (!isBrowser() || listenersBound) return
  listenersBound = true
  timer = setInterval(() => flush(false), FLUSH_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush(true)
  })
  window.addEventListener('pagehide', () => flush(true))
}

/** Stops the interval — only tests and hot reloads care. */
export function stopScheduler() {
  if (timer) clearInterval(timer)
  timer = null
  listenersBound = false
}

/**
 * Records one event. Safe to call anywhere on the client, including inside
 * handlers that run before hydration finishes — it is a no-op on the server.
 */
export function track(event: AppEvent, payload: TrackPayload = {}) {
  if (!isBrowser()) return
  try {
    ensureScheduler()
    const meta = payload.meta && typeof payload.meta === 'object' ? payload.meta : undefined
    buffer.push({
      event,
      entity_id: payload.entity_id ?? null,
      subject: payload.subject ?? null,
      value: typeof payload.value === 'number' && Number.isFinite(payload.value) ? payload.value : null,
      ...(meta ? { meta } : {}),
      ts: Date.now(),
    })
    if (buffer.length >= MAX_BATCH) flush(false)
  } catch {
    // never let analytics break a handler
  }
}

/** Like track(), but at most once per tab session for the given key. */
export function trackOnce(key: string, event: AppEvent, payload: TrackPayload = {}) {
  if (!firstTimeThisSession(`${event}:${key}`)) return
  track(event, payload)
}
