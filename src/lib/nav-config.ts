import { Newspaper, Calendar, BookOpen, Camera, MoreHorizontal, Clock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  id: string
  href: string
  label: string
  icon: string // icon name, resolved at render time
}

export const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'gallery', href: '/gallery', label: 'Dumbs', icon: 'Camera' },
  { id: 'news', href: '/news', label: 'Novosti', icon: 'Newspaper' },
  { id: 'events', href: '/events', label: 'Kalendar', icon: 'Calendar' },
  { id: 'lectures', href: '/lectures', label: 'Lekcije', icon: 'BookOpen' },
  { id: 'profile', href: '/profile', label: 'Još', icon: 'MoreHorizontal' },
  { id: 'schedule', href: '/schedule', label: 'Raspored', icon: 'Clock' },
]

export const DEFAULT_NAV_IDS = ['gallery', 'news', 'events', 'lectures', 'profile']

export const ICON_MAP: Record<string, LucideIcon> = {
  Camera,
  Newspaper,
  Calendar,
  BookOpen,
  MoreHorizontal,
  Clock,
}

export const NAV_CONFIG_KEY = 'nav_config'
export const MAX_NAV_ITEMS = 5

export function getNavConfig(): string[] {
  if (typeof window === 'undefined') return DEFAULT_NAV_IDS
  try {
    const saved = localStorage.getItem(NAV_CONFIG_KEY)
    if (saved) {
      const ids = JSON.parse(saved) as string[]
      if (Array.isArray(ids) && ids.length > 0 && ids.length <= MAX_NAV_ITEMS) {
        // Validate all ids exist
        const valid = ids.filter(id => ALL_NAV_ITEMS.some(item => item.id === id))
        if (valid.length > 0) return valid
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_NAV_IDS
}

export function saveNavConfig(ids: string[]) {
  localStorage.setItem(NAV_CONFIG_KEY, JSON.stringify(ids.slice(0, MAX_NAV_ITEMS)))
}

export function getResolvedNavItems(ids: string[]): (NavItem & { IconComponent: LucideIcon })[] {
  return ids
    .map(id => ALL_NAV_ITEMS.find(item => item.id === id))
    .filter((item): item is NavItem => !!item)
    .map(item => ({ ...item, IconComponent: ICON_MAP[item.icon] || MoreHorizontal }))
}
