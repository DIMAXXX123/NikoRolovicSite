'use client'

import { useEffect, useState } from 'react'
import { Palette } from 'lucide-react'

const themes = [
  {
    name: 'Purple Night',
    key: 'purple-night',
    color: '#a78bfa',
    vars: {
      '--theme-primary': '#a78bfa',
      '--theme-primary-foreground': '#09090b',
      '--theme-accent': '#6d28d9',
      '--theme-secondary': '#1a1a2e',
      '--theme-background': '#09090b',
      '--theme-foreground': '#fafafa',
      '--theme-card': '#0a0a0f',
      '--theme-muted': '#18181b',
      '--theme-muted-foreground': '#a1a1aa',
      '--theme-border': '#27272a',
    },
  },
  {
    name: 'Ocean Blue',
    key: 'ocean-blue',
    color: '#38bdf8',
    vars: {
      '--theme-primary': '#38bdf8',
      '--theme-primary-foreground': '#09090b',
      '--theme-accent': '#0284c7',
      '--theme-secondary': '#0c1a2e',
      '--theme-background': '#0a0a0f',
      '--theme-foreground': '#f0f9ff',
      '--theme-card': '#0a0f18',
      '--theme-muted': '#172033',
      '--theme-muted-foreground': '#7dd3fc',
      '--theme-border': '#1e3a5f',
    },
  },
  {
    name: 'Emerald Green',
    key: 'emerald-green',
    color: '#34d399',
    vars: {
      '--theme-primary': '#34d399',
      '--theme-primary-foreground': '#09090b',
      '--theme-accent': '#059669',
      '--theme-secondary': '#0a1f1a',
      '--theme-background': '#09090b',
      '--theme-foreground': '#f0fdf4',
      '--theme-card': '#0a0f0d',
      '--theme-muted': '#14291f',
      '--theme-muted-foreground': '#6ee7b7',
      '--theme-border': '#1a3d2e',
    },
  },
  {
    name: 'Sunset Orange',
    key: 'sunset-orange',
    color: '#fb923c',
    vars: {
      '--theme-primary': '#fb923c',
      '--theme-primary-foreground': '#09090b',
      '--theme-accent': '#ea580c',
      '--theme-secondary': '#1f150a',
      '--theme-background': '#0b0a09',
      '--theme-foreground': '#fff7ed',
      '--theme-card': '#0f0d0a',
      '--theme-muted': '#292014',
      '--theme-muted-foreground': '#fdba74',
      '--theme-border': '#3d2e1a',
    },
  },
  {
    name: 'Rose Pink',
    key: 'rose-pink',
    color: '#fb7185',
    vars: {
      '--theme-primary': '#fb7185',
      '--theme-primary-foreground': '#09090b',
      '--theme-accent': '#e11d48',
      '--theme-secondary': '#1f0a14',
      '--theme-background': '#0b090a',
      '--theme-foreground': '#fff1f2',
      '--theme-card': '#0f0a0c',
      '--theme-muted': '#291420',
      '--theme-muted-foreground': '#fda4af',
      '--theme-border': '#3d1a2a',
    },
  },
  {
    name: 'Arctic Light',
    key: 'arctic-light',
    color: '#3b82f6',
    vars: {
      '--theme-primary': '#3b82f6',
      '--theme-primary-foreground': '#ffffff',
      '--theme-accent': '#2563eb',
      '--theme-secondary': '#e2e8f0',
      '--theme-background': '#f8fafc',
      '--theme-foreground': '#0f172a',
      '--theme-card': '#ffffff',
      '--theme-muted': '#e2e8f0',
      '--theme-muted-foreground': '#64748b',
      '--theme-border': '#cbd5e1',
    },
  },
]

function applyTheme(themeKey: string) {
  const theme = themes.find(t => t.key === themeKey) || themes[0]
  const root = document.documentElement
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
  // Update glass and gradient for light theme
  if (themeKey === 'arctic-light') {
    root.classList.remove('dark')
  } else {
    root.classList.add('dark')
  }
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
        <div className="absolute right-0 top-full mt-2 px-3 py-1.5 rounded-lg bg-card border border-border/50 text-xs font-medium whitespace-nowrap animate-fade-in z-50">
          {themes[currentIndex].name}
        </div>
      )}
    </div>
  )
}
