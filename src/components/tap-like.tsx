'use client'

/**
 * TikTok-style like interactions, shared by the news feed and the gallery.
 *
 * - `useTapLike` / `<TapLikeSurface>`: double-tap LIKES (never unlikes) and
 *   spawns a floating heart at the tap point; every further tap inside a
 *   600 ms "spam window" spawns another heart; a single isolated tap fires
 *   `onSingleTap` after a 300 ms wait (so a double tap never triggers it).
 * - `<FloatingHearts>`: the fixed full-screen layer that renders the hearts
 *   (mount it once per page, e.g. next to the login prompt).
 * - `<LikeButton>`: outline icon button — the only way to unlike.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'

const DOUBLE_TAP_MS = 300
const SPAM_WINDOW_MS = 600
const MOVE_TOLERANCE_PX = 10
const HEART_MS = 900
const HEART_SIZE = 96

// ---------------------------------------------------------------------------
// Floating hearts — a tiny module-level store so every surface on the page
// shares the one fixed layer and hearts are independent of the cards.
// ---------------------------------------------------------------------------

export interface FloatingHeart {
  id: number
  x: number
  y: number
  rot: number
}

let nextHeartId = 1
let hearts: FloatingHeart[] = []
const EMPTY_HEARTS: FloatingHeart[] = []
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
function getSnapshot() {
  return hearts
}
function getServerSnapshot() {
  return EMPTY_HEARTS
}
const noopSubscribe = () => () => {}
const returnTrue = () => true
const returnFalse = () => false

/** Spawn one floating heart centred on a viewport point. */
export function spawnHeart(x: number, y: number) {
  const heart: FloatingHeart = {
    id: nextHeartId++,
    x,
    y,
    rot: Math.round((Math.random() * 50 - 25) * 10) / 10,
  }
  hearts = [...hearts, heart]
  emit()
  setTimeout(() => {
    hearts = hearts.filter((h) => h.id !== heart.id)
    emit()
  }, HEART_MS)
}

const HEART_PATH =
  'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'

const LAYER_STYLE: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 70,
  pointerEvents: 'none',
  overflow: 'hidden',
}

/** Fixed full-screen layer (portal to body) that draws the floating hearts. */
export function FloatingHearts() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const isClient = useSyncExternalStore(noopSubscribe, returnTrue, returnFalse)
  if (!isClient) return null

  return createPortal(
    <div data-tap-like-layer="" aria-hidden="true" style={LAYER_STYLE}>
      {list.map((heart) => (
        <svg
          key={heart.id}
          data-floating-heart=""
          viewBox="0 0 24 24"
          width={HEART_SIZE}
          height={HEART_SIZE}
          style={
            {
              position: 'absolute',
              left: heart.x - HEART_SIZE / 2,
              top: heart.y - HEART_SIZE / 2,
              '--rot': `${heart.rot}deg`,
              animation: `tiktokHeart ${HEART_MS}ms forwards`,
              willChange: 'transform, opacity',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))',
            } as CSSProperties
          }
        >
          {/* stroke sits under the fill (paint-order) so only a 2px white rim shows outside */}
          <path
            d={HEART_PATH}
            fill="#FF4B4B"
            stroke="#FFFFFF"
            strokeWidth={1}
            strokeLinejoin="round"
            paintOrder="stroke"
          />
        </svg>
      ))}
    </div>,
    document.body
  )
}

// ---------------------------------------------------------------------------
// Tap surface
// ---------------------------------------------------------------------------

export interface TapPoint {
  x: number
  y: number
}

export interface UseTapLikeOptions {
  /** Called on a double tap and on every spam tap. Must only LIKE (never unlike). */
  onLike: (point: TapPoint) => void
  /** Called ~300 ms after a single isolated tap (never on the first tap of a double tap). */
  onSingleTap?: () => void
}

const INTERACTIVE_SELECTOR = 'button, a, input, textarea, select, [role="button"], [data-tap-ignore]'

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && !!target.closest(INTERACTIVE_SELECTOR)
}

export interface TapSurfaceProps {
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void
  onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void
  onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => void
  style: CSSProperties
}

const SURFACE_STYLE: CSSProperties = { touchAction: 'manipulation' }

/**
 * Pointer handlers implementing the TikTok tap rules. Spread `surfaceProps`
 * on the element that should react to taps (a card, a photo box…).
 * Taps that start on buttons/links inside the surface are ignored.
 */
export function useTapLike({ onLike, onSingleTap }: UseTapLikeOptions): { surfaceProps: TapSurfaceProps } {
  const downRef = useRef<{ id: number; x: number; y: number } | null>(null)
  const lastTapRef = useRef(0)
  const spamUntilRef = useRef(0)
  const singleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearSingleTimer = useCallback(() => {
    if (singleTimerRef.current !== null) {
      clearTimeout(singleTimerRef.current)
      singleTimerRef.current = null
    }
  }, [])

  useEffect(() => clearSingleTimer, [clearSingleTimer])

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (isInteractiveTarget(e.target)) {
      downRef.current = null
      return
    }
    downRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
  }, [])

  const onPointerCancel = useCallback(() => {
    downRef.current = null
  }, [])

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const down = downRef.current
      downRef.current = null
      if (!down || down.id !== e.pointerId) return
      // A drag / scroll is not a tap.
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > MOVE_TOLERANCE_PX) return

      const now = Date.now()
      const point = { x: e.clientX, y: e.clientY }

      // Inside the spam window: every tap is another heart, window extends.
      if (now < spamUntilRef.current) {
        spamUntilRef.current = now + SPAM_WINDOW_MS
        lastTapRef.current = 0
        spawnHeart(point.x, point.y)
        haptic(3)
        onLike(point)
        return
      }

      // Second tap of a double tap.
      if (now - lastTapRef.current < DOUBLE_TAP_MS) {
        clearSingleTimer()
        lastTapRef.current = 0
        spamUntilRef.current = now + SPAM_WINDOW_MS
        spawnHeart(point.x, point.y)
        haptic(10)
        onLike(point)
        return
      }

      // First tap: wait to see whether a second one follows.
      lastTapRef.current = now
      clearSingleTimer()
      if (onSingleTap) {
        singleTimerRef.current = setTimeout(() => {
          singleTimerRef.current = null
          onSingleTap()
        }, DOUBLE_TAP_MS)
      }
    },
    [onLike, onSingleTap, clearSingleTimer]
  )

  return {
    surfaceProps: { onPointerDown, onPointerUp, onPointerCancel, style: SURFACE_STYLE },
  }
}

export interface TapLikeSurfaceProps extends UseTapLikeOptions {
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/** A <div> wired with `useTapLike`. */
export function TapLikeSurface({ onLike, onSingleTap, className, style, children }: TapLikeSurfaceProps) {
  const { surfaceProps } = useTapLike({ onLike, onSingleTap })
  return (
    <div
      {...surfaceProps}
      className={cn('select-none', className)}
      style={style ? { ...surfaceProps.style, ...style } : surfaceProps.style}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Like button
// ---------------------------------------------------------------------------

const ICON_SIZE = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-[22px]',
} as const

export interface LikeButtonProps {
  liked: boolean
  count?: number
  onToggle: () => void
  size?: keyof typeof ICON_SIZE
  className?: string
  label?: string
}

/**
 * Outline icon button (§4.1) with the heart; red tint when liked. Single tap
 * toggles — this is the only way to unlike. The icon pops on like and the
 * count slides up when it changes.
 */
export function LikeButton({
  liked,
  count,
  onToggle,
  size = 'md',
  className,
  label = 'Sviđa mi se',
}: LikeButtonProps) {
  // "Adjust state during render" pattern: remount the icon / number when the
  // prop changes so their CSS animations restart (no effects involved).
  const [pop, setPop] = useState(0)
  const [bump, setBump] = useState(0)
  const [prevLiked, setPrevLiked] = useState(liked)
  const [prevCount, setPrevCount] = useState(count)
  if (liked !== prevLiked) {
    setPrevLiked(liked)
    // Pop only on the outline → filled transition (also when the like came from a double tap).
    if (liked) setPop((n) => n + 1)
  }
  if (count !== prevCount) {
    setPrevCount(count)
    setBump((n) => n + 1)
  }

  return (
    <Button
      variant="outline"
      size="icon"
      aria-pressed={liked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        if (!liked) haptic(10)
        onToggle()
      }}
      className={cn(
        count !== undefined && 'w-auto min-w-11 gap-1.5 px-3 text-[13px]',
        liked
          ? 'border-[#FFB3B5] bg-[#FFDFE0] text-[#EA2B2B] shadow-[0_4px_0_#FFB3B5] hover:bg-[#FFDFE0]'
          : 'text-muted-foreground',
        className
      )}
    >
      <Heart
        key={`icon-${pop}`}
        strokeWidth={2.4}
        className={cn(
          ICON_SIZE[size],
          'transition-colors duration-200',
          liked && 'fill-current',
          pop > 0 && 'animate-like-pop'
        )}
      />
      {count !== undefined && (
        <span key={`count-${bump}`} className={cn('tabular-nums', bump > 0 && 'animate-like-count')}>
          {count}
        </span>
      )}
    </Button>
  )
}
