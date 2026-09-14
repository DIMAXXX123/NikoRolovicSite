'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'

const NEXT_KEY = 'login_next'

/** Where to send the visitor after a successful login (set by useLoginPrompt). */
export function consumeLoginNext(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const next = localStorage.getItem(NEXT_KEY)
    if (next) localStorage.removeItem(NEXT_KEY)
    return next && next.startsWith('/') ? next : null
  } catch {
    return null
  }
}

/**
 * Guests can browse without a session, but likes need a user. Instead of a
 * silent no-op the action shows a small card: "Prijavi se da lajkuješ".
 */
export function useLoginPrompt(message = 'Prijavi se da lajkuješ'): { prompt: () => void; element: ReactNode } {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => setOpen(false), 5000)
    return () => clearTimeout(t)
  }, [open])

  const prompt = useCallback(() => setOpen(true), [])

  const element = open ? (
    <div
      role="status"
      className="fixed left-4 right-4 top-[76px] z-[60] mx-auto max-w-md rounded-2xl border-2 border-border bg-card p-3 shadow-[0_2px_0_var(--color-border)] flex items-center gap-3 animate-slide-down"
    >
      <p className="flex-1 text-[13px] leading-[1.4] font-extrabold text-foreground">{message}</p>
      <Button
        size="sm"
        className="shrink-0 whitespace-nowrap"
        onClick={() => {
          try { localStorage.setItem(NEXT_KEY, pathname) } catch {}
          setOpen(false)
          router.push('/login')
        }}
      >
        <LogIn className="w-4 h-4" strokeWidth={2.6} />
        Prijavi se
      </Button>
    </div>
  ) : null

  return { prompt, element }
}
