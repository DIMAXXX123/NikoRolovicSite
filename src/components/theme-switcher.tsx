'use client'

import { useEffect, useState } from 'react'
import { Palette } from 'lucide-react'

const themes = [
  {
    name: 'Midnight',
    key: 'midnight',
    color: '#7c5cfc',
    vars: {
      '--theme-primary': '#7c5cfc',
      '--theme-primary-foreground': '#ffffff',
      '--theme-accent': '#5b3fd9',
      '--theme-secondary': '#0c0c14',
      '--theme-background': '#050508',
      '--theme-foreground': '#e8e8f0',
      '--theme-card': '#0c0c14',
      '--theme-muted': '#1a1a2e',
      '--theme-muted-foreground': '#6b6b80',
      '--theme-border': '#1a1a2e',
    },
  },
  {
    name: 'Arctic',
    key: 'arctic',
    color: '#3b82f6',
    vars: {
      '--theme-primary': '#3b82f6',
      '--theme-primary-foreground': '#ffffff',
      '--theme-accent': '#2563eb',
      '--theme-secondary': '#0a0e14',
      '--theme-background': '#060a10',
      '--theme-foreground': '#e8ecf0',
      '--theme-card': '#0a0e18',
      '--theme-muted': '#141e2e',
      '--theme-muted-foreground': '#5a7090',
      '--theme-border': '#152030',
    },
  },
  {
    name: 'Forest',
    key: 'forest',
    color: '#10b981',
    vars: {
      '--theme-primary': '#10b981',
      '--theme-primary-foreground': '#ffffff',
      '--theme-accent': '#059669',
      '--theme-secondary': '#080e0a',
      '--theme-background': '#050a08',
      '--theme-foreground': '#e0f0e8',
      '--theme-card': '#0a140e',
      '--theme-muted': '#142e20',
      '--theme-muted-foreground': '#5a8070',
      '--theme-border': '#1a3028',
    },
  },
]

function applyTheme(themeKey: string) {
  const theme = themes.find(t => t.key === themeKey) || themes[0]
  const root = document.documentElement
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
  root.classList.add('dark')
}

export function ThemeSwitcher() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('nr-theme')
    if (saved) {
      const idx = themes.findIndex(t => t.key === saved)
      if (idx >= 0) {
        setCurrentIndex(idx)
        applyTheme(saved)
      }
    } else {
      applyTheme(themes[0].key)
    }
  }, [])

  function cycleTheme() {
    const next = (currentIndex + 1) % themes.length
    setCurrentIndex(next)
    const theme = themes[next]
    applyTheme(theme.key)
    localStorage.setItem('nr-theme', theme.key)
    setShowPopup(true)
    setTimeout(() => setShowPopup(false), 1500)
  }

  return (
    <div className="relative">
      <button
        onClick={cycleTheme}
        className="theme-btn w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] border border-white/[0.06] transition-all"
        style={{ color: themes[currentIndex].color }}
        title={themes[currentIndex].name}
      >
        <Palette className="w-4 h-4" />
      </button>
      {showPopup && (
        <div className="absolute right-0 top-full mt-2 px-3 py-1.5 rounded-xl bg-[#0c0c14] border border-[#1a1a2e] text-xs font-medium whitespace-nowrap animate-fade-in z-50">
          {themes[currentIndex].name}
        </div>
      )}
    </div>
  )
}
