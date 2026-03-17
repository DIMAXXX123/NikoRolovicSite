'use client'

import { BottomNav } from '@/components/bottom-nav'
import { ThemeSwitcher } from '@/components/theme-switcher'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen pb-20">
      {/* Fixed glassmorphism header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-header">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center">
              <span className="text-xs font-bold text-white">NR</span>
            </div>
            <span className="font-semibold text-sm gradient-text">Niko Rolović</span>
          </div>
          <ThemeSwitcher />
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 pt-18">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
