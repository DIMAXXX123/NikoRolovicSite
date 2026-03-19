'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { ProfileGuard } from '@/components/profile-guard'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { getNavConfig, ALL_NAV_ITEMS } from '@/lib/nav-config'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [opacity, setOpacity] = useState(1)
  const prevPath = useRef(pathname)

  const [translateY, setTranslateY] = useState(0)

  useEffect(() => {
    if (prevPath.current !== pathname) {
      setOpacity(0)
      setTranslateY(8)
      const t = setTimeout(() => {
        setOpacity(1)
        setTranslateY(0)
      }, 50)
      prevPath.current = pathname
      return () => clearTimeout(t)
    }
  }, [pathname])

  return (
    <div className="min-h-screen pb-28">
      {/* Premium glassmorphism header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-header-premium">
        <div className="max-w-lg mx-auto px-5 h-16 flex items-center justify-between">
          <button
            onClick={() => {
              const ids = getNavConfig()
              const first = ALL_NAV_ITEMS.find(item => item.id === ids[0])
              if (first) router.push(first.href)
            }}
            className="flex items-center gap-3 active:scale-95 transition-transform press-ripple rounded-2xl py-1.5 px-1 -ml-1"
          >
            {/* Logo — gradient circle with glow */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--theme-primary, #a78bfa) 0%, var(--theme-accent, #7c3aed) 100%)',
                boxShadow: '0 0 20px -4px var(--theme-primary, rgba(167, 139, 250, 0.5)), 0 4px 12px -2px rgba(0, 0, 0, 0.3)',
              }}
            >
              <span className="text-sm font-extrabold text-white tracking-tight" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>NR</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[15px] text-foreground tracking-tight">Niko Rolović</span>
              <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-lg bg-primary/15 text-primary border border-primary/20">Beta</span>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/tournament')}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.06] active:scale-90 transition-all hover:bg-white/[0.08] hover:border-primary/20 btn-press"
              title="Turnir u košarci"
            >
              <span className="text-sm">🏀</span>
            </button>
            <button
              onClick={() => router.push('/game')}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.06] active:scale-90 transition-all hover:bg-white/[0.08] hover:border-primary/20 overflow-hidden btn-press"
              title="Block Blast"
            >
              <div className="grid grid-cols-3 gap-[1px] w-6 h-6">
                <div className="rounded-[2px] bg-red-500" style={{backgroundImage:'linear-gradient(135deg,rgba(255,255,255,0.35),transparent 50%,rgba(0,0,0,0.2))',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.3)'}} />
                <div className="rounded-[2px] bg-red-600" style={{backgroundImage:'linear-gradient(135deg,rgba(255,255,255,0.35),transparent 50%,rgba(0,0,0,0.2))',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.3)'}} />
                <div className="rounded-[2px]" />
                <div className="rounded-[2px]" />
                <div className="rounded-[2px] bg-yellow-400" style={{backgroundImage:'linear-gradient(135deg,rgba(255,255,255,0.35),transparent 50%,rgba(0,0,0,0.2))',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.3)'}} />
                <div className="rounded-[2px] bg-orange-400" style={{backgroundImage:'linear-gradient(135deg,rgba(255,255,255,0.35),transparent 50%,rgba(0,0,0,0.2))',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.3)'}} />
                <div className="rounded-[2px] bg-green-500" style={{backgroundImage:'linear-gradient(135deg,rgba(255,255,255,0.35),transparent 50%,rgba(0,0,0,0.2))',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.3)'}} />
                <div className="rounded-[2px] bg-green-600" style={{backgroundImage:'linear-gradient(135deg,rgba(255,255,255,0.35),transparent 50%,rgba(0,0,0,0.2))',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.3)'}} />
                <div className="rounded-[2px] bg-blue-500" style={{backgroundImage:'linear-gradient(135deg,rgba(255,255,255,0.35),transparent 50%,rgba(0,0,0,0.2))',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.3)'}} />
              </div>
            </button>
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <ProfileGuard />
      <main className="max-w-lg mx-auto px-4 pt-18">
        <div className="page-content-transition" style={{ opacity, transform: `translateY(${translateY}px)` }}>
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
