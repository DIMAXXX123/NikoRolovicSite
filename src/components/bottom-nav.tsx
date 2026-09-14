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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-border"
      style={{
        height: 'calc(84px + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="max-w-md mx-auto flex justify-around items-start pt-2 px-[10px]">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-[3px] w-[62px] transition-[color,transform] duration-[120ms] active:translate-y-[1px] ${
                isActive ? 'text-primary-text' : 'text-disabled'
              }`}
            >
              <div
                className={`w-[54px] h-11 rounded-xl border-2 flex items-center justify-center transition-[background-color,border-color] duration-[120ms] ${
                  isActive
                    ? 'bg-primary-light border-primary-light-border'
                    : 'bg-transparent border-transparent'
                }`}
              >
                <item.IconComponent
                  className="w-[26px] h-[26px]"
                  strokeWidth={2.4}
                  fill="none"
                  stroke="currentColor"
                />
              </div>
              <span className="text-[10px] leading-[12px] font-extrabold uppercase tracking-[0.04em]">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
