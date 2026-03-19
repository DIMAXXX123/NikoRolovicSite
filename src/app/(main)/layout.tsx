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
      {/* Fixed glassmorphism header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-header">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => {
              const ids = getNavConfig()
              const first = ALL_NAV_ITEMS.find(item => item.id === ids[0])
              if (first) router.push(first.href)
            }}
            className="flex items-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--theme-primary, #a78bfa)' }}>
              <span className="text-xs font-bold text-white">NR</span>
            </div>
            <span className="font-semibold text-sm gradient-text">Niko Rolović</span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">Beta</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/tournament')}
              className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
              title="Turnir u košarci"
            >
              <span className="text-xl animate-bounce">🏀</span>
            </button>
            <button
              onClick={() => router.push('/game')}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 active:scale-90 transition-transform shadow-lg shadow-blue-500/30 overflow-hidden animate-[blockPulse_2s_ease-in-out_infinite]"
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
      <main className="max-w-lg mx-auto px-4 pt-16">
        <div className="page-content-transition" style={{ opacity, transform: `translateY(${translateY}px)` }}>
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
