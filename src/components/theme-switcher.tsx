'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
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

const STORAGE_KEY = 'nr-theme'

// Unknown / legacy keys (midnight, arctic, forest) fall back to zeleno.
function themeIndex(themeKey: string | null) {
  const idx = themeKey ? themes.findIndex(t => t.key === themeKey) : -1
  return idx >= 0 ? idx : 0
}

function applyTheme(themeKey: string) {
  const theme = themes[themeIndex(themeKey)]
  const root = document.documentElement
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}

// The saved theme lives in localStorage — an external store. Reading it through
// useSyncExternalStore keeps the server render on the default theme and lets
// the client pick up the saved one without a setState-in-effect.
const listeners = new Set<() => void>()
function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}
function getSnapshot() {
  return themes[themeIndex(localStorage.getItem(STORAGE_KEY))].key
}
function getServerSnapshot() {
  return themes[0].key
}

export function ThemeSwitcher() {
  const themeKey = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const currentIndex = themeIndex(themeKey)
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    applyTheme(themeKey)
  }, [themeKey])

  function cycleTheme() {
    const next = (currentIndex + 1) % themes.length
    const theme = themes[next]
    localStorage.setItem(STORAGE_KEY, theme.key)
    listeners.forEach(l => l())
    setShowPopup(true)
    setTimeout(() => setShowPopup(false), 1500)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={cycleTheme}
        className="theme-btn w-10 h-10 rounded-xl flex items-center justify-center bg-card border-2 border-border shadow-[0_3px_0_#E5E5E5] select-none"
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
