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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-violet-700 shadow-lg shadow-purple-500/25">
              <span className="text-sm font-black text-white tracking-tight">NR</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[15px] text-white tracking-tight">Niko Rolović</span>
              <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/20">Beta</span>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/tournament')}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.06] border border-white/[0.08] active:scale-90 transition-all hover:bg-white/[0.1] btn-press"
              title="Turnir u košarci"
            >
              <span className="text-sm">🏀</span>
            </button>
            <button
              onClick={() => router.push('/game')}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.06] border border-white/[0.08] active:scale-90 transition-all hover:bg-white/[0.1] overflow-hidden btn-press"
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
