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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav-premium" style={{ height: '70px' }}>
      <div className="flex items-center justify-around h-full max-w-md mx-auto px-3">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1.5 px-4 py-2 transition-all duration-200 ${
                isActive
                  ? 'text-primary'
                  : 'text-[#3d3d50] hover:text-[#6b6b80]'
              }`}
            >
              <item.IconComponent
                className={`w-[22px] h-[22px] transition-all duration-200 ${
                  isActive ? 'text-primary' : ''
                }`}
                strokeWidth={isActive ? 2.5 : 1.5}
                fill={isActive ? 'currentColor' : 'none'}
              />
              <span className={`text-[10px] transition-all duration-200 ${
                isActive ? 'font-bold text-primary' : 'font-medium'
              }`}>{item.label}</span>
              {/* Active dot — 4px below */}
              {isActive && (
                <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary animate-pop-in" />
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
