'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export type Toast = {
  id: number
  message: string
  type: ToastType
  duration: number
}

type ToastOptions = {
  type?: ToastType
  /** Milliseconds on screen. Errors stick around longer than confirmations. */
  duration?: number
}

type ToastContextValue = {
  /** Returns the toast id, so a caller can dismiss it early if it wants to. */
  toast: (message: string, options?: ToastOptions) => number
  success: (message: string, options?: ToastOptions) => number
  error: (message: string, options?: ToastOptions) => number
  info: (message: string, options?: ToastOptions) => number
  warning: (message: string, options?: ToastOptions) => number
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 3000,
  info: 3000,
  warning: 4500,
  error: 6000,
}

const MAX_VISIBLE = 3

const STYLES: Record<ToastType, { icon: typeof CheckCircle2; className: string }> = {
  success: {
    icon: CheckCircle2,
    className: 'bg-emerald-500/95 text-white border-emerald-300/30',
  },
  error: {
    icon: XCircle,
    className: 'bg-red-500/95 text-white border-red-300/30',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-amber-500/95 text-black border-amber-300/40',
  },
  info: {
    icon: Info,
    className: 'bg-[#1a1a2e]/95 text-white border-white/15',
  },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts(current => current.filter(t => t.id !== id))
  }, [])

  const push = useCallback(
    (message: string, options?: ToastOptions) => {
      const type = options?.type ?? 'success'
      const duration = options?.duration ?? DEFAULT_DURATION[type]
      const id = nextId.current++

      setToasts(current => [...current, { id, message, type, duration }].slice(-MAX_VISIBLE))
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration)
      )
      return id
    },
    [dismiss]
  )

  // Clear pending timers if the provider ever unmounts.
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: push,
      success: (message, options) => push(message, { ...options, type: 'success' }),
      error: (message, options) => push(message, { ...options, type: 'error' }),
      info: (message, options) => push(message, { ...options, type: 'info' }),
      warning: (message, options) => push(message, { ...options, type: 'warning' }),
      dismiss,
    }),
    [push, dismiss]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      // aria-live so a screen reader announces the message; pointer-events-none
      // on the stack keeps the page tappable between toasts.
      aria-live="polite"
      aria-atomic="false"
      className="fixed left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 4.75rem)' }}
    >
      {toasts.map(toast => {
        const { icon: Icon, className } = STYLES[toast.type]
        return (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto w-full flex items-start gap-2.5 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-sm text-sm font-medium animate-fade-in ${className}`}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span className="flex-1 min-w-0 break-words">{toast.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 -mr-1 p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Zatvori obavještenje"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside <ToastProvider>')
  }
  return context
}
