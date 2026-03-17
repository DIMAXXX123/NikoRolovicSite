'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { ThemeSwitcher } from '@/components/theme-switcher'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [opacity, setOpacity] = useState(1)
  const prevPath = useRef(pathname)

  useEffect(() => {
    if (prevPath.current !== pathname) {
      setOpacity(0)
      const t = setTimeout(() => setOpacity(1), 30)
      prevPath.current = pathname
      return () => clearTimeout(t)
    }
  }, [pathname])

  return (
    <div className="min-h-screen pb-24">
      {/* Fixed glassmorphism header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-header">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--theme-primary, #a78bfa)' }}>
              <span className="text-xs font-bold text-white">NR</span>
            </div>
            <span className="font-semibold text-sm gradient-text">Niko Rolović</span>
          </div>
          <ThemeSwitcher />
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 pt-18">
        <div className="page-content-transition" style={{ opacity }}>
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
