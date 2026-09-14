'use client'

import { useEffect, useState } from 'react'
import { Palette } from 'lucide-react'

// Three LIGHT accent themes — only the primary family changes,
// everything else stays white (docs/DUOLINGO_REDESIGN.md §6).
const themes = [
  {
    name: 'Zeleno',
    key: 'zeleno',
    color: '#58CC02',
    vars: {
      '--theme-primary': '#58CC02',
      '--theme-primary-dark': '#46A302',
      '--theme-primary-light': '#D7FFB8',
      '--theme-primary-light-border': '#B5EE8A',
      '--theme-primary-text': '#58A700',
    },
  },
  {
    name: 'Plavo',
    key: 'plavo',
    color: '#1CB0F6',
    vars: {
      '--theme-primary': '#1CB0F6',
      '--theme-primary-dark': '#1899D6',
      '--theme-primary-light': '#DDF4FF',
      '--theme-primary-light-border': '#84D8FF',
      '--theme-primary-text': '#1899D6',
    },
  },
  {
    name: 'Ljubičasto',
    key: 'ljubicasto',
    color: '#CE82FF',
    vars: {
      '--theme-primary': '#CE82FF',
      '--theme-primary-dark': '#A560E8',
      '--theme-primary-light': '#F3E3FF',
      '--theme-primary-light-border': '#E1BDFF',
      '--theme-primary-text': '#A560E8',
    },
  },
]

function applyTheme(themeKey: string) {
  // Unknown / legacy keys (midnight, arctic, forest) fall back to zeleno (§6).
  const theme = themes.find(t => t.key === themeKey) || themes[0]
  const root = document.documentElement
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
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
        type="button"
        onClick={cycleTheme}
        className="theme-btn relative w-10 h-10 rounded-xl flex items-center justify-center bg-card border-2 border-border shadow-[0_3px_0_#E5E5E5] select-none before:absolute before:-inset-0.5 before:content-['']"
        style={{ color: themes[currentIndex].color }}
        title={themes[currentIndex].name}
        aria-label={themes[currentIndex].name}
      >
        <Palette className="w-5 h-5" strokeWidth={2.4} />
      </button>
      {showPopup && (
        <div className="absolute right-0 top-full mt-2 px-3 py-2 rounded-2xl bg-card border-2 border-border shadow-[0_2px_0_#E5E5E5] text-[13px] font-extrabold text-foreground whitespace-nowrap animate-fade-in z-50">
          {themes[currentIndex].name}
        </div>
      )}
    </div>
  )
}
