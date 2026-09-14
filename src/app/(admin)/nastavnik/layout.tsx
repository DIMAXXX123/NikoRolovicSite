'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, ClipboardList, LayoutDashboard, Lock, Users, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DEMO_AUTO_ADMIN } from '@/lib/demo'
import { NASTAVNIK_PICKER_ROLES, NASTAVNIK_ROLES } from '@/lib/roles'
import { DIREKTOR_PERIODS, type DirektorPeriod } from '@/lib/direktor-types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ErrorBoundary } from '@/components/error-boundary'
import { NastavnikContext, useNastavnikShell } from './_lib/context'
import { useNastavnikStats } from './_lib/use-stats'

const PERIOD_KEY = 'nastavnik_period'
const AUTHOR_KEY = 'nastavnik_author'

const TABS: { href: string; label: string; Icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { href: '/nastavnik', label: 'Pregled', Icon: LayoutDashboard, exact: true },
  { href: '/nastavnik/lekcije', label: 'Moje lekcije', Icon: BookOpen },
  { href: '/nastavnik/razredi', label: 'Razredi', Icon: Users },
  { href: '/nastavnik/domaci', label: 'Domaći', Icon: ClipboardList },
]

function readPeriod(): DirektorPeriod {
  try {
    const v = localStorage.getItem(PERIOD_KEY)
    if (v && (DIREKTOR_PERIODS as readonly string[]).includes(v)) return v as DirektorPeriod
  } catch {}
  return '7d'
}

function readAuthor(): string | null {
  try {
    // ?author=<id> (from the Direktor panel) wins over the remembered choice.
    const fromUrl = new URLSearchParams(window.location.search).get('author')
    if (fromUrl) {
      localStorage.setItem(AUTHOR_KEY, fromUrl)
      return fromUrl
    }
    return localStorage.getItem(AUTHOR_KEY) || null
  } catch {
    return null
  }
}

/**
 * Shell of the Nastavnik panel: client-side role gate (the API routes check
 * the role again server-side), header with back + title + teacher picker,
 * and its own 4-tab bottom navigation in the app's nav style (§5).
 */
export default function NastavnikLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading')
  const [role, setRole] = useState<string>('')
  const [period, setPeriodState] = useState<DirektorPeriod>('7d')
  const [author, setAuthorState] = useState<string | null>(null)

  useEffect(() => {
    setPeriodState(readPeriod())
    setAuthorState(readAuthor())
  }, [])

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        // Demo mode: <AutoLogin /> signs the visitor in and reloads.
        if (!DEMO_AUTO_ADMIN) router.push('/login')
        return
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (cancelled) return
      const r = profile?.role ?? ''
      setRole(r)
      setState((NASTAVNIK_ROLES as readonly string[]).includes(r) ? 'ok' : 'denied')
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  const canPick = (NASTAVNIK_PICKER_ROLES as readonly string[]).includes(role)

  const setPeriod = useCallback((p: DirektorPeriod) => {
    setPeriodState(p)
    try {
      localStorage.setItem(PERIOD_KEY, p)
    } catch {}
  }, [])

  const setAuthor = useCallback((id: string | null) => {
    setAuthorState(id)
    try {
      if (id) localStorage.setItem(AUTHOR_KEY, id)
      else localStorage.removeItem(AUTHOR_KEY)
    } catch {}
  }, [])

  const ctx = useMemo(
    () => ({ period, setPeriod, author: canPick ? author : null, setAuthor, role, canPick }),
    [period, setPeriod, author, setAuthor, role, canPick],
  )

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
            <p className="text-[17px] leading-[1.3] font-extrabold text-foreground">Panel profesora nije dostupan</p>
            <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground">Pristup imaju profesori, razredni starješine, pedagog i direktor.</p>
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
    <NastavnikContext.Provider value={ctx}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header — 64px, white, 2px bottom border (same as the app's) */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b-2 border-border">
          <div className="max-w-md mx-auto px-4 h-16 flex items-center gap-2">
            <Link
              href="/profile"
              aria-label="Nazad"
              className="w-11 h-11 flex-shrink-0 rounded-xl bg-background border-2 border-border shadow-[0_2px_0_var(--color-border)] flex items-center justify-center text-secondary transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.6} />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] leading-[1.2] font-extrabold text-heading truncate">Panel profesora</p>
              <p className="text-[12px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground mt-0.5">Profesor</p>
            </div>
            {canPick && <TeacherPicker />}
          </div>
        </header>

        <main id="main-content" className="max-w-md mx-auto px-4 pt-20 pb-[100px]">
          <ErrorBoundary key={pathname} label="Ova stranica se nije učitala">
            <div className="animate-fade-in">{children}</div>
          </ErrorBoundary>
        </main>

        {/* Panel bottom nav — same geometry as src/components/bottom-nav.tsx (§5) */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-border"
          style={{ height: 'calc(84px + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}
          aria-label="Panel profesora"
        >
          <div className="max-w-md mx-auto flex justify-around items-start pt-2 px-[10px]">
            {TABS.map(({ href, label, Icon, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center gap-[3px] w-[70px] transition-[color,transform] duration-[120ms] active:translate-y-[1px] ${
                    isActive ? 'text-primary-text' : 'text-disabled'
                  }`}
                >
                  <div
                    className={`w-[54px] h-11 rounded-xl border-2 flex items-center justify-center transition-[background-color,border-color] duration-[120ms] ${
                      isActive ? 'bg-primary-light border-primary-light-border' : 'bg-transparent border-transparent'
                    }`}
                  >
                    <Icon className="w-[26px] h-[26px]" strokeWidth={2.4} fill="none" stroke="currentColor" />
                  </div>
                  <span className="text-[10px] leading-[12px] font-extrabold uppercase tracking-[0.04em] text-center">{label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </NastavnikContext.Provider>
  )
}

/** Header picker for admin / direktor / pedagog / creator: every lecture author. */
function TeacherPicker() {
  const { period, author, setAuthor } = useNastavnikShell()
  const { data } = useNastavnikStats(period, author)
  const authors = data?.authors ?? []
  const current = data?.meta.author?.id ?? ''
  if (authors.length === 0) return null
  const value = author ?? current
  return (
    <label className="relative flex-shrink-0 max-w-[150px]">
      <span className="sr-only">Profesor</span>
      <select
        value={value}
        onChange={(e) => setAuthor(e.target.value || null)}
        className="h-11 w-full appearance-none rounded-xl border-2 border-border bg-background pl-3 pr-8 text-[12px] font-extrabold uppercase tracking-[0.04em] text-secondary shadow-[0_2px_0_var(--color-border)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring truncate"
      >
        {!authors.some((a) => a.id === value) && value && <option value={value}>{data?.meta.author?.name ?? 'Ja'}</option>}
        {authors.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} ({a.lectures})
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-disabled" strokeWidth={2.6} />
    </label>
  )
}
