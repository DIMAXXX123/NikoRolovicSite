'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BookOpen, CalendarDays, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLocalJson, writeLocalJson } from '@/lib/local-json'
import { parseHomework } from '@/app/(main)/lectures/lecture-utils'
import { HOMEWORK_DONE_KEY } from '@/app/(main)/lectures/[subject]/[id]/homework-card'

// ---------------------------------------------------------------------------
// Header bell. Rendered only while something is unread; a tap on an item
// marks it read and jumps to the page it belongs to. Read flags live on the
// device — `notifications_read` → { [id]: ISO timestamp }.
// ---------------------------------------------------------------------------

export const NOTIFICATIONS_READ_KEY = 'notifications_read'
const NO_READ: Record<string, string> = {}
const HOMEWORK_WINDOW_DAYS = 14
const EVENT_WINDOW_DAYS = 7

type Notification = {
  id: string
  kind: 'homework' | 'event'
  title: string
  subtitle: string
  href: string
}

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

function shortDate(iso: string) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${Number(m[3])}. ${Number(m[2])}.` : ''
}

function useNotifications(): Notification[] {
  const [items, setItems] = useState<Notification[]>([])

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    async function load() {
      // Guests have no profile → no class → events only (events are anon-readable).
      const { data: { user } } = await supabase.auth.getUser()
      let classNumber: number | null = null
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('class_number')
          .eq('id', user.id)
          .maybeSingle()
        classNumber = profile?.class_number ?? null
      }

      const today = todayIso()
      const since = new Date()
      since.setDate(since.getDate() - HOMEWORK_WINDOW_DAYS)
      const until = new Date()
      until.setDate(until.getDate() + EVENT_WINDOW_DAYS)

      const [{ data: lectures }, { data: events }] = await Promise.all([
        classNumber
          ? supabase
              .from('lectures')
              .select('id, title, subject, content, created_at')
              .eq('class_number', classNumber)
              .like('content', '%HOMEWORK:%')
              .order('created_at', { ascending: false })
              .limit(30)
          : Promise.resolve({ data: [] as { id: string; title: string; subject: string; content: string; created_at: string }[] }),
        supabase
          .from('events')
          .select('id, title, event_date, event_type')
          .in('event_type', ['domaci', 'test', 'pismeni'])
          .gte('event_date', today)
          .lte('event_date', until.toISOString().split('T')[0])
          .order('event_date', { ascending: true })
          .limit(10),
      ])
      if (cancelled) return

      const next: Notification[] = []
      for (const l of lectures ?? []) {
        const hw = parseHomework(l.content as string)
        if (!hw) continue
        // Dated homework lives until its due day; undated ones fade after two weeks.
        if (hw.due ? hw.due.slice(0, 10) < today : (l.created_at as string) < since.toISOString()) continue
        next.push({
          id: `hw:${l.id}`,
          kind: 'homework',
          title: `Domaći: ${l.subject}`,
          subtitle: hw.due ? `${l.title} · do ${shortDate(hw.due)}` : l.title,
          href: `/lectures/${encodeURIComponent(l.subject as string)}/${l.id}`,
        })
      }
      const eventLabel: Record<string, string> = { domaci: 'Domaći', test: 'Test', pismeni: 'Pismeni' }
      for (const e of events ?? []) {
        next.push({
          id: `ev:${e.id}`,
          kind: 'event',
          title: `${eventLabel[e.event_type as string] ?? 'Događaj'}: ${e.title}`,
          subtitle: shortDate(e.event_date as string),
          href: '/events',
        })
      }
      setItems(next)
    }

    load()
    return () => { cancelled = true }
  }, [])

  return items
}

function readStore(key: string): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '{}')
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, string>)
      : {}
  } catch {
    return {}
  }
}

export function NotificationBell() {
  const router = useRouter()
  const all = useNotifications()
  const read = useLocalJson<Record<string, string>>(NOTIFICATIONS_READ_KEY, NO_READ)
  const done = useLocalJson<Record<string, string>>(HOMEWORK_DONE_KEY, NO_READ)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const unread = all.filter(n => !read[n.id] && !(n.kind === 'homework' && done[n.id.slice(3)]))

  const markRead = useCallback((ids: string[]) => {
    const current = readStore(NOTIFICATIONS_READ_KEY)
    const stamp = new Date().toISOString()
    ids.forEach(id => { current[id] = stamp })
    try {
      writeLocalJson(NOTIFICATIONS_READ_KEY, current)
    } catch {
      // Private mode / quota — the flag is a convenience, not data.
    }
  }, [])

  useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (unread.length === 0) return null

  function openItem(n: Notification) {
    markRead([n.id])
    setOpen(false)
    router.push(n.href)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-background border-2 border-border shadow-[0_3px_0_var(--color-border)] text-[#FF9600] transition-[transform,box-shadow] duration-[120ms] hover:-translate-y-[1px] active:translate-y-[3px] active:shadow-none"
        title="Obavještenja"
        aria-label={`Obavještenja (${unread.length})`}
        aria-expanded={open}
      >
        <Bell className="w-5 h-5" strokeWidth={2.4} />
        <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#FF4B4B] border-2 border-background text-primary-foreground text-[10px] font-black leading-none flex items-center justify-center tabular-nums">
          {unread.length > 9 ? '9+' : unread.length}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-32px)] max-w-[340px] rounded-2xl bg-card border-2 border-border shadow-[0_4px_0_var(--color-border)] overflow-hidden animate-fade-in z-50">
          <div className="flex items-center justify-between px-4 h-11 border-b-2 border-border">
            <span className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Obavještenja</span>
            <button
              type="button"
              onClick={() => { markRead(unread.map(n => n.id)); setOpen(false) }}
              className="text-[12px] font-extrabold text-secondary uppercase tracking-[0.04em]"
            >
              Pročitano
            </button>
          </div>
          <ul className="max-h-[60vh] overflow-y-auto">
            {unread.map(n => {
              const Icon = n.kind === 'homework' ? BookOpen : CalendarDays
              const tint = n.kind === 'homework'
                ? 'bg-[#FFF4C4] text-[#C79000]'
                : 'bg-secondary-light text-secondary'
              return (
                <li key={n.id} className="border-b-2 border-border last:border-b-0">
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className="w-full min-h-16 px-4 py-3 flex items-center gap-3 text-left transition-colors active:bg-muted"
                  >
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tint}`}>
                      <Icon className="w-5 h-5" strokeWidth={2.4} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15px] font-extrabold leading-[1.3] text-heading truncate">{n.title}</span>
                      <span className="block text-[13px] font-bold leading-[1.4] text-muted-foreground truncate">{n.subtitle}</span>
                    </span>
                    <ChevronRight className="w-5 h-5 text-disabled shrink-0" strokeWidth={2.6} />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
