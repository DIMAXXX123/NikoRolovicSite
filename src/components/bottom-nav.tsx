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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav glass-premium">
      <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-2">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-primary nav-active-pill'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.IconComponent className={`w-6 h-6 transition-all ${isActive ? 'drop-shadow-[0_0_10px_rgba(167,139,250,0.6)]' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
