'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getNavConfig, getResolvedNavItems, NAV_CONFIG_KEY } from '@/lib/nav-config'

export function BottomNav() {
  const pathname = usePathname()
  const [navIds, setNavIds] = useState(getNavConfig)

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === NAV_CONFIG_KEY) {
        setNavIds(getNavConfig())
      }
    }
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

  const orderedIds = (() => {
    const withoutProfile = navIds.filter(id => id !== 'profile')
    return [...withoutProfile, 'profile']
  })()
  const items = getResolvedNavItems(orderedIds)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav-premium">
      <div className="flex items-center justify-around h-18 max-w-lg mx-auto px-3">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 px-4 py-2 transition-all duration-300 ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground/70'
              }`}
            >
              <item.IconComponent
                className={`relative w-[22px] h-[22px] transition-all duration-300 ${
                  isActive ? 'text-primary' : ''
                }`}
                strokeWidth={isActive ? 2.5 : 1.5}
                fill={isActive ? 'currentColor' : 'none'}
              />
              <span className={`relative text-[10px] font-medium transition-all duration-300 ${
                isActive ? 'text-primary/80' : ''
              }`}>{item.label}</span>
              {/* Active dot indicator — small dot below text */}
              {isActive && (
                <div
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary animate-pop-in"
                  style={{ boxShadow: '0 0 6px var(--theme-primary, rgba(167, 139, 250, 0.8))' }}
                />
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
