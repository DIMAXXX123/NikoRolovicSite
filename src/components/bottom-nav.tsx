'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getNavConfig, getResolvedNavItems, NAV_CONFIG_KEY } from '@/lib/nav-config'

export function BottomNav() {
  const pathname = usePathname()
  const [navIds, setNavIds] = useState(getNavConfig)

  useEffect(() => {
    // Re-read config when localStorage changes (from nav editor)
    function handleStorage(e: StorageEvent) {
      if (e.key === NAV_CONFIG_KEY) {
        setNavIds(getNavConfig())
      }
    }
    // Also listen for custom event (same-tab updates)
    function handleCustom() {
      setNavIds(getNavConfig())
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener('nav-config-changed', handleCustom)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('nav-config-changed', handleCustom)
    }
  }, [])

  // Ensure 'profile' (Još) is always the last (rightmost) item
  const orderedIds = (() => {
    const withoutProfile = navIds.filter(id => id !== 'profile')
    return [...withoutProfile, 'profile']
  })()
  const items = getResolvedNavItems(orderedIds)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav-premium">
      <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-3">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 px-3.5 py-2 rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'text-purple-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {/* Active indicator pill */}
              {isActive && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-purple-500/15 to-violet-600/10 border border-purple-500/20 animate-scale-in" />
              )}
              <item.IconComponent className={`relative w-6 h-6 transition-all duration-300 ${
                isActive ? 'drop-shadow-[0_0_12px_rgba(167,139,250,0.7)] scale-110' : ''
              }`} />
              <span className={`relative text-[10px] font-medium transition-all duration-300 ${
                isActive ? 'text-purple-300' : ''
              }`}>{item.label}</span>
              {/* Active dot */}
              {isActive && (
                <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(167,139,250,0.8)] animate-pop-in" />
              )}
            </Link>
          )
        })}
      </div>
      {/* Safe area spacer for iOS */}
      <div className="h-safe-area-bottom" />
    </nav>
  )
}
