'use client'

import { useState } from 'react'
import { Monitor, Moon, Palette, Sun } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import type { ColorMode } from '@/lib/theme'

const MODE_LABEL: Record<ColorMode, string> = {
  system: 'Sistemska tema',
  light: 'Svijetla tema',
  dark: 'Tamna tema',
}

const MODE_ICON = {
  system: Monitor,
  light: Sun,
  dark: Moon,
}

export function ThemeSwitcher() {
  const { palette, colorMode, cyclePalette, cycleColorMode } = useTheme()
  const [popup, setPopup] = useState<string | null>(null)

  function flash(label: string) {
    setPopup(label)
    setTimeout(() => setPopup(current => (current === label ? null : current)), 1500)
  }

  const ModeIcon = MODE_ICON[colorMode]

  return (
    <div className="relative flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => flash(MODE_LABEL[cycleColorMode()])}
        className="theme-btn w-8 h-8 rounded-lg flex items-center justify-center bg-muted/40 border border-border text-muted-foreground transition-all"
        title={MODE_LABEL[colorMode]}
        aria-label={MODE_LABEL[colorMode]}
      >
        <ModeIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => flash(cyclePalette().name)}
        className="theme-btn w-8 h-8 rounded-lg flex items-center justify-center bg-muted/40 border border-border transition-all"
        style={{ color: palette.color }}
        title={palette.name}
        aria-label={`Paleta: ${palette.name}`}
      >
        <Palette className="w-4 h-4" />
      </button>
      {popup && (
        <div
          role="status"
          className="absolute right-0 top-full mt-2 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-medium whitespace-nowrap animate-fade-in z-50"
        >
          {popup}
        </div>
      )}
    </div>
  )
}
