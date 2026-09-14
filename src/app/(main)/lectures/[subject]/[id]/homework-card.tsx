'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronLeft, ChevronRight, ClipboardList, Lightbulb, Undo2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useLocalJson, writeLocalJson } from '@/lib/local-json'
import { track } from '@/lib/analytics'
import { formatMath, type Homework } from '../../lecture-utils'

// ---------------------------------------------------------------------------
// Per-device "done" flag — `homework_done` → { [lectureId]: ISO timestamp }.
// ---------------------------------------------------------------------------

export const HOMEWORK_DONE_KEY = 'homework_done'
const NO_DONE: Record<string, string> = {}

function useHomeworkDone(lectureId: string): [boolean, () => void] {
  const done = useLocalJson<Record<string, string>>(HOMEWORK_DONE_KEY, NO_DONE)
  const isDone = typeof done === 'object' && done !== null && !!done[lectureId]
  const toggle = useCallback(() => {
    let current: Record<string, string> = {}
    try {
      const raw = localStorage.getItem(HOMEWORK_DONE_KEY)
      const parsed: unknown = raw ? JSON.parse(raw) : {}
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        current = parsed as Record<string, string>
      }
    } catch {
      current = {}
    }
    const next = { ...current }
    if (next[lectureId]) delete next[lectureId]
    else next[lectureId] = new Date().toISOString()
    track('homework_done', { entity_id: lectureId, value: next[lectureId] ? 1 : 0 })
    try {
      writeLocalJson(HOMEWORK_DONE_KEY, next)
    } catch {
      // Private mode / quota — the flag is a convenience, not data.
    }
  }, [lectureId])
  return [isDone, toggle]
}

// ---------------------------------------------------------------------------
// Due date → "18. 9." (d. M.). Date-only ISO strings are read as-is so the
// device time zone never shifts the day.
// ---------------------------------------------------------------------------

function parseDue(due: string | null): { label: string; overdue: boolean } | null {
  if (!due) return null
  const m = due.match(/^(\d{4})-(\d{2})-(\d{2})/)
  let y: number, mo: number, d: number
  if (m) {
    y = Number(m[1])
    mo = Number(m[2])
    d = Number(m[3])
  } else {
    const date = new Date(due)
    if (Number.isNaN(date.getTime())) return null
    y = date.getFullYear()
    mo = date.getMonth() + 1
    d = date.getDate()
  }
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const today = new Date()
  const todayKey = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const dueKey = y * 10000 + mo * 100 + d
  return { label: `Rok: ${d}. ${mo}.`, overdue: dueKey < todayKey }
}

// ---------------------------------------------------------------------------
// Full-screen image viewer — white overlay, native scrolling of an oversized
// image for panning, pinch / tap to zoom, swipe / arrows between images.
// ---------------------------------------------------------------------------

const ZOOM_MIN = 1
const ZOOM_MAX = 4
const ZOOM_TAP = 2.5
const SWIPE_PX = 50

function ImageViewer({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: string[]
  index: number
  onIndexChange: (next: number) => void
  onClose: () => void
}) {
  const [scale, setScale] = useState(ZOOM_MIN)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null)
  const swipeRef = useRef<{ x: number; y: number } | null>(null)
  const count = images.length
  const hasMany = count > 1

  const go = useCallback(
    (delta: number) => {
      if (!hasMany) return
      setScale(ZOOM_MIN)
      onIndexChange((index + delta + count) % count)
    },
    [count, hasMany, index, onIndexChange]
  )

  // Body scroll lock + keyboard.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [go, onClose])

  // Pinch zoom needs a non-passive listener so the page does not scroll along.
  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    const distance = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchRef.current = { dist: distance(e.touches), scale }
        swipeRef.current = null
      } else if (e.touches.length === 1) {
        swipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }
    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault()
        const ratio = distance(e.touches) / pinchRef.current.dist
        setScale(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, pinchRef.current.scale * ratio)))
      }
    }
    const onEnd = (e: TouchEvent) => {
      if (pinchRef.current) {
        if (e.touches.length === 0) pinchRef.current = null
        return
      }
      const start = swipeRef.current
      swipeRef.current = null
      if (!start || scale > ZOOM_MIN + 0.05 || e.changedTouches.length === 0) return
      const dx = e.changedTouches[0].clientX - start.x
      const dy = e.changedTouches[0].clientY - start.y
      if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1)
    }
    node.addEventListener('touchstart', onStart, { passive: true })
    node.addEventListener('touchmove', onMove, { passive: false })
    node.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      node.removeEventListener('touchstart', onStart)
      node.removeEventListener('touchmove', onMove)
      node.removeEventListener('touchend', onEnd)
    }
  }, [go, scale])

  const zoomed = scale > ZOOM_MIN + 0.05

  // Tap-to-zoom starts from the middle of the page, not its top-left corner.
  useLayoutEffect(() => {
    const node = scrollRef.current
    if (!node || !zoomed) return
    node.scrollLeft = (node.scrollWidth - node.clientWidth) / 2
    node.scrollTop = (node.scrollHeight - node.clientHeight) / 2
  }, [zoomed, index])

  const closeOnBackdrop = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }
  const viewerButton =
    'w-11 h-11 rounded-xl border-2 border-border bg-background text-secondary shadow-[0_2px_0_var(--color-border)] flex items-center justify-center transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Stranica iz udžbenika"
      data-homework-viewer=""
      className="fixed inset-0 z-[100] bg-background animate-fade-in"
    >
      {/* Scrollable stage: at 1× the image fits; zoomed, it overflows and scrolls natively. */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-auto overscroll-contain"
        style={{ touchAction: zoomed ? 'pan-x pan-y' : 'pan-y' }}
        onClick={closeOnBackdrop}
      >
        {zoomed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[index]}
            alt={`Stranica iz udžbenika ${index + 1} od ${count}`}
            draggable={false}
            onClick={() => setScale(ZOOM_MIN)}
            className="block h-auto max-w-none select-none"
            style={{ width: `${scale * 100}%` }}
          />
        ) : (
          <div className="min-h-full w-full flex items-center justify-center px-2 py-16" onClick={closeOnBackdrop}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[index]}
              alt={`Stranica iz udžbenika ${index + 1} od ${count}`}
              draggable={false}
              onClick={() => setScale(ZOOM_TAP)}
              className="block max-w-full max-h-[calc(100dvh-8rem)] w-auto h-auto rounded-xl border-2 border-[#FFE28A] select-none"
            />
          </div>
        )}
      </div>

      {/* Chrome — top bar with counter + close, bottom bar with prev/next. */}
      <div className="absolute top-0 inset-x-0 h-16 px-4 flex items-center gap-3 pointer-events-none">
        <div className="h-9 px-3 rounded-full bg-background/90 border-2 border-border flex items-center gap-2 min-w-0">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-heading tabular-nums shrink-0">
            {hasMany ? `${index + 1} / ${count}` : 'Udžbenik'}
          </p>
          <p className="text-[12px] font-bold text-muted-foreground truncate">{zoomed ? 'Tapni da smanjiš' : 'Tapni da uvećaš'}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Zatvori" className={`${viewerButton} ml-auto pointer-events-auto`}>
          <X className="w-6 h-6" strokeWidth={2.6} />
        </button>
      </div>
      {hasMany && (
        <div className="absolute bottom-0 inset-x-0 h-16 px-4 flex items-center justify-between pointer-events-none">
          <button type="button" onClick={() => go(-1)} aria-label="Prethodna slika" className={`${viewerButton} pointer-events-auto`}>
            <ChevronLeft className="w-6 h-6" strokeWidth={2.6} />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Sljedeća slika" className={`${viewerButton} pointer-events-auto`}>
            <ChevronRight className="w-6 h-6" strokeWidth={2.6} />
          </button>
        </div>
      )}
    </div>,
    document.body
  )
}

// ---------------------------------------------------------------------------
// Image thumbnails — one image full width, 2–4 as a square grid.
// ---------------------------------------------------------------------------

const IMAGE_CAPTION = 'Stranica iz udžbenika — tapni da uvećaš'

function HomeworkImages({ images, compact, onOpen }: { images: string[]; compact: boolean; onOpen: (i: number) => void }) {
  if (images.length === 0) return null
  const frame =
    'block overflow-hidden rounded-xl border-2 border-[#FFE28A] bg-background transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

  if (compact) {
    return (
      <div className="flex gap-2">
        {images.map((src, i) => (
          <button key={i} type="button" onClick={() => onOpen(i)} aria-label={`Otvori sliku ${i + 1}`} className={`${frame} w-14 h-14 shrink-0`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {images.length === 1 ? (
        <button type="button" onClick={() => onOpen(0)} aria-label="Otvori sliku" className={`${frame} w-full`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[0]} alt="Stranica iz udžbenika" loading="lazy" className="w-full h-auto" />
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {images.map((src, i) => (
            <button key={i} type="button" onClick={() => onOpen(i)} aria-label={`Otvori sliku ${i + 1}`} className={`${frame} aspect-square`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Stranica iz udžbenika ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <p className="text-[13px] font-bold text-muted-foreground">{IMAGE_CAPTION}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Method hint — hidden until the pupil asks. The task is meant to be tried
// first; "Pomozi" reveals the hint and stays open for the rest of the visit.
// ---------------------------------------------------------------------------

function TaskHint({ how }: { how: string }) {
  const [open, setOpen] = useState(false)
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-xl border-2 border-[#FFE28A] bg-[#FFF9E0] px-3 text-[12px] font-extrabold uppercase tracking-[0.04em] text-[#C79000] shadow-[0_2px_0_#FFE28A] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Lightbulb className="w-4 h-4" strokeWidth={2.6} /> Pomozi
      </button>
    )
  }
  return (
    <p className="flex items-start gap-1.5 text-[13px] font-bold text-muted-foreground leading-[1.4] animate-fade-in">
      <Lightbulb className="w-4 h-4 shrink-0 mt-px text-[#C79000]" strokeWidth={2.6} />
      <span>{formatMath(how)}</span>
    </p>
  )
}

// ---------------------------------------------------------------------------
// The card
// ---------------------------------------------------------------------------

const GOLD_CARD = 'border-[#FFE28A] bg-[#FFF9E0] shadow-[0_2px_0_#FFE28A] overflow-visible'
const GOLD_TINT = 'color-mix(in srgb, #FFC800 22%, white)'

export interface HomeworkCardProps {
  lectureId: string
  homework: Homework
  /** The small repeat above the practice CTA — same data, less room. */
  compact?: boolean
}

/**
 * "Domaći" — the gold card a pupil must not miss. Rendered twice per lecture:
 * in full before section 1 and compact above the "Provjeri znanje" button;
 * both read the same per-device done flag, so toggling one updates the other.
 */
export function HomeworkCard({ lectureId, homework, compact = false }: HomeworkCardProps) {
  const [done, toggleDone] = useHomeworkDone(lectureId)
  const [viewer, setViewer] = useState<number | null>(null)
  const due = parseDue(homework.due)
  const { text, tasks, images } = homework

  const badges = (
    <>
      {due && (
        <Badge variant={due.overdue && !done ? 'destructive' : 'gold'}>{due.label}</Badge>
      )}
      {done && (
        <Badge>
          <Check strokeWidth={3} /> Urađeno
        </Badge>
      )}
    </>
  )

  const doneButton = (
    <Button
      variant="outline"
      size={compact ? 'sm' : 'default'}
      className={`w-full ${done ? '' : 'text-primary-text'}`}
      aria-pressed={done}
      onClick={toggleDone}
    >
      {done ? (
        <>
          <Undo2 strokeWidth={2.6} /> Poništi
        </>
      ) : (
        <>
          <Check strokeWidth={3} /> Označi kao urađeno
        </>
      )}
    </Button>
  )

  const viewerNode = viewer !== null && images.length > 0 && (
    <ImageViewer images={images} index={viewer} onIndexChange={setViewer} onClose={() => setViewer(null)} />
  )

  if (compact) {
    return (
      <Card size="sm" data-lecture-homework="compact" className={GOLD_CARD}>
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: GOLD_TINT }}>
            <ClipboardList className="w-5 h-5 text-[#C79000]" strokeWidth={2.6} />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-[17px] font-extrabold leading-[1.3] text-heading">Domaći</h3>
              {badges}
            </div>
            {text && <p className="text-[13px] font-bold text-muted-foreground leading-[1.4] line-clamp-3 whitespace-pre-line">{formatMath(text)}</p>}
            {tasks.length > 0 && (
              <p className="text-[13px] font-extrabold text-[#C79000]">{tasks.map((t) => t.label || t.what).join(' · ')}</p>
            )}
          </div>
        </div>
        <HomeworkImages images={images} compact onOpen={setViewer} />
        {doneButton}
        {viewerNode}
      </Card>
    )
  }

  return (
    <Card id="domaci" data-lecture-homework="full" className={`gap-4 scroll-mt-[120px] ${GOLD_CARD}`}>
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: GOLD_TINT }}>
          <ClipboardList className="w-6 h-6 text-[#C79000]" strokeWidth={2.6} />
        </span>
        <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-1 min-h-11">
          <h2 className="text-[20px] font-extrabold leading-[1.25] text-heading">Domaći</h2>
          {badges}
        </div>
      </div>

      {text && <p className="text-[15px] font-bold text-foreground leading-[1.6] whitespace-pre-line">{formatMath(text)}</p>}

      {tasks.length > 0 && (
        <ol className="space-y-2.5">
          {tasks.map((task, i) => (
            <li key={i} className="rounded-2xl border-2 border-[#FFE28A] bg-background shadow-[0_2px_0_#FFE28A] px-4 py-3 space-y-1">
              {task.label && (
                <p className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-[#C79000]">{formatMath(task.label)}</p>
              )}
              {task.what && <p className="text-[15px] font-bold text-foreground leading-[1.5]">{formatMath(task.what)}</p>}
              {task.how && <TaskHint how={task.how} />}
            </li>
          ))}
        </ol>
      )}

      <HomeworkImages images={images} compact={false} onOpen={setViewer} />

      {doneButton}
      {viewerNode}
    </Card>
  )
}
