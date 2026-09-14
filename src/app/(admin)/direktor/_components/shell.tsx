'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, BookOpen, LayoutDashboard, Megaphone, Presentation, Sparkles, Users } from 'lucide-react'
import { DIREKTOR_PERIODS } from '@/lib/direktor-types'
import { ErrorBoundary } from '@/components/error-boundary'
import { PERIOD_LABELS, PeriodProvider, usePeriod } from '../_lib/direktor-client'

/**
 * Chrome of the /direktor panel: fixed header (back to app · title · AI),
 * the period chips row and the panel's own 5-tab bottom navigation (same look
 * as src/components/bottom-nav.tsx). Everything is hidden when printing
 * (the report page relies on that).
 */

const TABS = [
  { href: '/direktor', label: 'Pregled', Icon: LayoutDashboard, exact: true },
  { href: '/direktor/ucenje', label: 'Učenje', Icon: BookOpen, exact: false },
  { href: '/direktor/razredi', label: 'Razredi', Icon: Users, exact: false },
  { href: '/direktor/nastava', label: 'Nastava', Icon: Presentation, exact: false },
  { href: '/direktor/zajednica', label: 'Zajednica', Icon: Megaphone, exact: false },
] as const

const TITLES: { prefix: string; title: string }[] = [
  { prefix: '/direktor/ucenje', title: 'Učenje' },
  { prefix: '/direktor/razredi', title: 'Razredi' },
  { prefix: '/direktor/nastava', title: 'Nastava' },
  { prefix: '/direktor/zajednica', title: 'Zajednica' },
  { prefix: '/direktor/ai', title: 'AI analiza' },
  { prefix: '/direktor/izvjestaj', title: 'Izvještaj za Ministarstvo' },
]

function pageTitle(pathname: string): string {
  return TITLES.find((t) => pathname.startsWith(t.prefix))?.title ?? 'Direktor'
}

const ICON_BUTTON =
  'w-11 h-11 rounded-xl flex items-center justify-center bg-background border-2 border-border shadow-[0_2px_0_var(--color-border)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none'

function PeriodChips() {
  const { period, setPeriod } = usePeriod()
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Period">
      {DIREKTOR_PERIODS.map((p) => {
        const active = p === period
        return (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setPeriod(p)}
            className={`h-11 shrink-0 rounded-xl border-2 px-[11px] text-[12px] font-extrabold uppercase tracking-[0.04em] transition-[transform,box-shadow,background-color,color,border-color] duration-[80ms] active:translate-y-[2px] active:shadow-none ${
              active
                ? 'border-[#84D8FF] bg-[#DDF4FF] text-secondary shadow-[0_2px_0_#84D8FF]'
                : 'border-border bg-background text-muted-foreground shadow-[0_2px_0_var(--color-border)]'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        )
      })}
    </div>
  )
}

function Header({ pathname }: { pathname: string }) {
  const isRoot = pathname === '/direktor'
  const isAi = pathname.startsWith('/direktor/ai')
  const showChips = !isAi
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b-2 border-border print:hidden">
      <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between gap-2">
        <Link
          href={isRoot ? '/profile' : '/direktor'}
          className="inline-flex items-center gap-2 min-w-0 text-secondary group"
          aria-label={isRoot ? 'Nazad u aplikaciju' : 'Nazad na pregled'}
        >
          <span className={`${ICON_BUTTON} group-active:translate-y-[2px] group-active:shadow-none shrink-0`}>
            <ArrowLeft className="w-5 h-5" strokeWidth={2.6} />
          </span>
          <span className="min-w-0 flex flex-col">
            <span className="text-[17px] leading-[1.2] font-extrabold text-heading truncate">{pageTitle(pathname)}</span>
            <span className="text-[11px] leading-[1.2] font-extrabold uppercase tracking-[0.06em] text-muted-foreground truncate">
              Panel direktora
            </span>
          </span>
        </Link>
        <Link
          href="/direktor/ai"
          className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border-2 px-3 text-[12px] font-extrabold uppercase tracking-[0.04em] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none ${
            isAi
              ? 'border-[#E1BDFF] bg-[#F3E3FF] text-accent-dark shadow-[0_2px_0_#E1BDFF]'
              : 'border-border bg-background text-accent-dark shadow-[0_2px_0_var(--color-border)]'
          }`}
        >
          <Sparkles className="w-4 h-4" strokeWidth={2.6} />
          AI
        </Link>
      </div>
      {showChips && (
        <div className="max-w-md mx-auto">
          <PeriodChips />
        </div>
      )}
    </header>
  )
}

function PanelNav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-border print:hidden"
      style={{
        height: 'calc(84px + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="Navigacija panela"
    >
      <div className="max-w-md mx-auto flex justify-around items-start pt-2 px-[10px]">
        {TABS.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href || pathname.startsWith('/direktor/ai') || pathname.startsWith('/direktor/izvjestaj')
            : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-[3px] w-[62px] transition-[color,transform] duration-[120ms] active:translate-y-[1px] ${
                isActive ? 'text-primary-text' : 'text-disabled'
              }`}
            >
              <div
                className={`w-[54px] h-11 rounded-xl border-2 flex items-center justify-center transition-[background-color,border-color] duration-[120ms] ${
                  isActive ? 'bg-primary-light border-primary-light-border' : 'bg-transparent border-transparent'
                }`}
              >
                <tab.Icon className="w-[26px] h-[26px]" strokeWidth={2.4} fill="none" stroke="currentColor" />
              </div>
              <span className="text-[10px] leading-[12px] font-extrabold uppercase tracking-[0.04em]">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function DirektorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/direktor'
  const isAi = pathname.startsWith('/direktor/ai')
  return (
    <PeriodProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Header pathname={pathname} />
        <main
          id="main-content"
          className={`max-w-md mx-auto px-4 pb-[100px] print:max-w-none print:p-0 ${isAi ? 'pt-20' : 'pt-[124px]'}`}
        >
          <ErrorBoundary key={pathname} label="Ova stranica se nije učitala">
            <div className="animate-fade-in">{children}</div>
          </ErrorBoundary>
        </main>
        <PanelNav pathname={pathname} />
      </div>
    </PeriodProvider>
  )
}
