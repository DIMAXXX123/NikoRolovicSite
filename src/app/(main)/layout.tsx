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
    <div className="min-h-screen pb-24">
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
          </button>
          <ThemeSwitcher />
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
