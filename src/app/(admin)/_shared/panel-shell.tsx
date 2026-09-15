'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, Lock, type LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DEMO_AUTO_ADMIN } from '@/lib/demo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ErrorBoundary } from '@/components/error-boundary'

/**
 * Shared chrome for the Škola and Aplikacija panels: client-side role gate
 * (the API routes re-check server-side), 64px header with a back button and
 * a row of period chips, the app's bottom-nav geometry for the panel tabs.
 */

export interface PanelTab {
  href: string
  label: string
  Icon: LucideIcon
  exact?: boolean
}

export interface PanelShellProps<P extends string> {
  title: string
  eyebrow: string
  roles: readonly string[]
  deniedText: string
  tabs: PanelTab[]
  periods: readonly P[]
  periodLabels: Record<P, string>
  defaultPeriod: P
  storageKey: string
  /** Panel accent for the active tab (Tailwind classes). */
  accent?: { text: string; bg: string; border: string }
  children: ReactNode
}

interface PanelCtx {
  period: string
  setPeriod: (p: string) => void
  role: string
}

const Ctx = createContext<PanelCtx | null>(null)

export function usePanel<P extends string = string>() {
  const c = useContext(Ctx)
  if (!c) throw new Error('usePanel outside PanelShell')
  return c as unknown as { period: P; setPeriod: (p: P) => void; role: string }
}

export function PanelShell<P extends string>({ title, eyebrow, roles, deniedText, tabs, periods, periodLabels, defaultPeriod, storageKey, accent, children }: PanelShellProps<P>) {
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading')
  const [role, setRole] = useState('')
  const [period, setPeriodState] = useState<string>(defaultPeriod)

  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey)
      if (v && (periods as readonly string[]).includes(v)) setPeriodState(v)
    } catch {}
  }, [storageKey, periods])

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        if (!DEMO_AUTO_ADMIN) router.push('/login')
        return
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (cancelled) return
      const r = profile?.role ?? ''
      setRole(r)
      setState(roles.includes(r) ? 'ok' : 'denied')
    })()
    return () => {
      cancelled = true
    }
  }, [router, roles])

  const setPeriod = useCallback(
    (p: string) => {
      setPeriodState(p)
      try {
        localStorage.setItem(storageKey, p)
      } catch {}
    },
    [storageKey],
  )

  const ctx = useMemo(() => ({ period, setPeriod, role }), [period, setPeriod, role])
  const ac = accent ?? { text: 'text-primary-text', bg: 'bg-primary-light', border: 'border-primary-light-border' }

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-[3px] border-border border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (state === 'denied') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-md mx-auto px-4 pt-10">
          <Card className="items-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-disabled">
              <Lock className="w-7 h-7" strokeWidth={2.4} />
            </div>
            <p className="text-[17px] leading-[1.3] font-extrabold text-foreground">{title} nije dostupan</p>
            <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground">{deniedText}</p>
            <Button variant="outline" className="w-full" onClick={() => router.push('/profile')}>
              <ArrowLeft strokeWidth={2.6} />
              Nazad
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <Ctx.Provider value={ctx}>
      <div className="min-h-screen bg-background text-foreground">
        <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b-2 border-border print:hidden">
          <div className="max-w-md mx-auto px-4 h-16 flex items-center gap-2">
            <Link
              href="/profile"
              aria-label="Nazad"
              className="w-11 h-11 flex-shrink-0 rounded-xl bg-background border-2 border-border shadow-[0_2px_0_var(--color-border)] flex items-center justify-center text-secondary transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.6} />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] leading-[1.2] font-extrabold text-heading truncate">{title}</p>
              <p className="text-[12px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground mt-0.5">{eyebrow}</p>
            </div>
          </div>
          <div className="max-w-md mx-auto flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Period">
            {periods.map((p) => {
              const active = p === period
              return (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPeriod(p)}
                  className={`h-11 shrink-0 rounded-xl border-2 px-[11px] text-[12px] font-extrabold uppercase tracking-[0.04em] transition-[transform,box-shadow,background-color,color,border-color] duration-[80ms] active:translate-y-[2px] active:shadow-none ${
                    active ? 'border-[#84D8FF] bg-[#DDF4FF] text-secondary shadow-[0_2px_0_#84D8FF]' : 'border-border bg-background text-muted-foreground shadow-[0_2px_0_var(--color-border)]'
                  }`}
                >
                  {periodLabels[p]}
                </button>
              )
            })}
          </div>
        </header>

        <main id="main-content" className="max-w-md mx-auto px-4 pt-[124px] pb-[100px] print:max-w-none print:p-0">
          <ErrorBoundary key={pathname} label="Ova stranica se nije učitala">
            <div className="animate-fade-in">{children}</div>
          </ErrorBoundary>
        </main>

        <nav
          className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-border print:hidden"
          style={{ height: 'calc(84px + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}
          aria-label={title}
        >
          <div className="max-w-md mx-auto flex justify-around items-start pt-2 px-[10px]">
            {tabs.map(({ href, label, Icon, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center gap-[3px] w-[64px] transition-[color,transform] duration-[120ms] active:translate-y-[1px] ${isActive ? ac.text : 'text-disabled'}`}
                >
                  <div className={`w-[54px] h-11 rounded-xl border-2 flex items-center justify-center transition-[background-color,border-color] duration-[120ms] ${isActive ? `${ac.bg} ${ac.border}` : 'bg-transparent border-transparent'}`}>
                    <Icon className="w-[26px] h-[26px]" strokeWidth={2.4} fill="none" stroke="currentColor" />
                  </div>
                  <span className="text-[10px] leading-[12px] font-extrabold uppercase tracking-[0.04em] text-center">{label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </Ctx.Provider>
  )
}
