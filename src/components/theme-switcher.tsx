'use client'

import { useEffect, useState } from 'react'
import { Palette } from 'lucide-react'

const themes = [
  {
    name: 'Midnight Purple',
    key: 'midnight-purple',
    color: '#a78bfa',
    vars: {
      '--theme-primary': '#a78bfa',
      '--theme-primary-foreground': '#0a0a12',
      '--theme-accent': '#7c3aed',
      '--theme-secondary': '#16152a',
      '--theme-background': '#0a0a12',
      '--theme-foreground': '#f4f4f6',
      '--theme-card': '#0e0e1a',
      '--theme-muted': '#1a1a2e',
      '--theme-muted-foreground': '#9b9bb0',
      '--theme-border': '#1f1f38',
    },
  },
  {
    name: 'Ocean Blue',
    key: 'ocean-blue',
    color: '#60a5fa',
    vars: {
      '--theme-primary': '#60a5fa',
      '--theme-primary-foreground': '#0a0f14',
      '--theme-accent': '#3b82f6',
      '--theme-secondary': '#0f1a2e',
      '--theme-background': '#0a0f14',
      '--theme-foreground': '#edf4fc',
      '--theme-card': '#0d1520',
      '--theme-muted': '#142238',
      '--theme-muted-foreground': '#7cb3f0',
      '--theme-border': '#1a3050',
    },
  },
  {
    name: 'Emerald Dark',
    key: 'emerald-dark',
    color: '#34d399',
    vars: {
      '--theme-primary': '#34d399',
      '--theme-primary-foreground': '#0a120f',
      '--theme-accent': '#10b981',
      '--theme-secondary': '#0f1f1a',
      '--theme-background': '#0a120f',
      '--theme-foreground': '#edfcf6',
      '--theme-card': '#0d1814',
      '--theme-muted': '#142e24',
      '--theme-muted-foreground': '#6ee7b7',
      '--theme-border': '#1a3d2e',
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
      // Apply default theme on mount
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
        className="theme-btn w-8 h-8 rounded-full flex items-center justify-center transition-all"
        style={{ backgroundColor: themes[currentIndex].color + '20', color: themes[currentIndex].color }}
        title={themes[currentIndex].name}
      >
        <Palette className="w-4 h-4" />
      </button>
      {showPopup && (
        <div className="absolute right-0 top-full mt-2 px-3 py-1.5 rounded-xl bg-card border border-border/50 text-xs font-medium whitespace-nowrap animate-fade-in z-50">
          {themes[currentIndex].name}
        </div>
      )}
    </div>
  )
}
