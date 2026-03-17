'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Newspaper, Calendar, BookOpen, Camera, User } from 'lucide-react'

const navItems = [
  { href: '/gallery', label: 'Dumbs', icon: Camera },
  { href: '/news', label: 'Novosti', icon: Newspaper },
  { href: '/events', label: 'Kalendar', icon: Calendar },
  { href: '/lectures', label: 'Lekcije', icon: BookOpen },
  { href: '/profile', label: 'Profil', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
