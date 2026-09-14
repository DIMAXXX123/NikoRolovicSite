'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { ProfileGuard } from '@/components/profile-guard'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Badge } from '@/components/ui/badge'
import { getNavConfig, ALL_NAV_ITEMS } from '@/lib/nav-config'

const HEADER_ICON_BUTTON =
  'w-10 h-10 rounded-xl flex items-center justify-center bg-background border-2 border-border shadow-[0_3px_0_var(--color-border)] transition-[transform,box-shadow] duration-[120ms] hover:-translate-y-[1px] active:translate-y-[3px] active:shadow-none'

// Flat 3×3 mini grid for the Block Blast button (null = empty cell)
const MINI_GRID: (string | null)[] = [
  '#FF4B4B', '#EA2B2B', null,
  null, '#FFC800', '#FF9600',
  '#58CC02', '#46A302', '#1CB0F6',
]

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [animKey, setAnimKey] = useState(pathname)

  useEffect(() => {
    setAnimKey(pathname)
  }, [pathname])

  return (
    <div className="min-h-screen">
      {/* Header — 64px, white, 2px bottom border */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b-2 border-border">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              const ids = getNavConfig()
              const first = ALL_NAV_ITEMS.find(item => item.id === ids[0])
              if (first) router.push(first.href)
            }}
            className="flex items-center gap-2.5 min-w-0 rounded-2xl py-1.5 px-1 -ml-1 transition-transform duration-[120ms] active:translate-y-[1px]"
          >
            {/* NR mark — green with 3D edge */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary shadow-[0_3px_0_var(--color-primary-dark)]">
              <span className="text-[14px] font-black text-primary-foreground">NR</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-extrabold text-[15px] text-foreground whitespace-nowrap truncate">Niko Rolović</span>
              <Badge variant="outline" className="text-[9px] h-5 px-1.5 shrink-0">
                Beta
              </Badge>
            </div>
          </button>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => router.push('/tournament')}
              className={HEADER_ICON_BUTTON}
              title="Turnir u košarci"
            >
              <span className="text-lg leading-none">🏀</span>
            </button>
            <button
              onClick={() => router.push('/game')}
              className={HEADER_ICON_BUTTON}
              title="Block Blast"
            >
              <div className="grid grid-cols-3 gap-[2px] w-6 h-6">
                {MINI_GRID.map((color, i) => (
                  <div
                    key={i}
                    className="rounded-[2px]"
                    style={color ? { backgroundColor: color } : undefined}
                  />
                ))}
              </div>
            </button>
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <ProfileGuard />
      <main className="max-w-md mx-auto px-4 pt-16 pb-[100px]">
        <div key={animKey} className="animate-fade-in">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
