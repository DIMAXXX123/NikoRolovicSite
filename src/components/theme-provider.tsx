'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'
import {
  COLOR_MODE_STORAGE_KEY,
  DEFAULT_PALETTE,
  PALETTES,
  PALETTE_STORAGE_KEY,
  THEME_CHANGED_EVENT,
  applyTheme,
  getPalette,
  isColorMode,
  type ColorMode,
  type Palette,
  type ResolvedColorMode,
} from '@/lib/theme'

type ThemeContextValue = {
  palette: Palette
  palettes: Palette[]
  setPalette: (key: string) => void
  /** Moves to the next palette and returns it, for the confirmation popup. */
  cyclePalette: () => Palette
  colorMode: ColorMode
  setColorMode: (mode: ColorMode) => void
  cycleColorMode: () => ColorMode
  /** What the colour mode actually resolves to right now. */
  resolved: ResolvedColorMode
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const MODE_CYCLE: ColorMode[] = ['system', 'light', 'dark']
const DARK_QUERY = '(prefers-color-scheme: dark)'

/**
 * The stored choices and the phone's own light/dark setting are external state,
 * so they are read through useSyncExternalStore rather than mirrored into React
 * state — that keeps hydration honest and avoids a setState-on-mount cascade.
 */

function subscribeToStoredTheme(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(THEME_CHANGED_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(THEME_CHANGED_EVENT, onChange)
  }
}

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    // Private mode / storage disabled.
    return null
  }
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // The choice just will not survive a reload.
  }
  window.dispatchEvent(new Event(THEME_CHANGED_EVENT))
}

function getPaletteKeySnapshot() {
  return getPalette(readStored(PALETTE_STORAGE_KEY)).key
}

function getColorModeSnapshot(): ColorMode {
  const stored = readStored(COLOR_MODE_STORAGE_KEY)
  return isColorMode(stored) ? stored : 'system'
}

function subscribeToSystemScheme(onChange: () => void) {
  if (!window.matchMedia) return () => {}
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function getSystemSchemeSnapshot(): ResolvedColorMode {
  if (!window.matchMedia) return 'dark'
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

// Server render (and hydration) assumes the defaults; the bootstrap script in
// <head> has already painted the real values, and the first client snapshot
// corrects the React tree right after hydration.
const serverPaletteKey = () => DEFAULT_PALETTE.key
const serverColorMode = (): ColorMode => 'system'
const serverSystemScheme = (): ResolvedColorMode => 'dark'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const paletteKey = useSyncExternalStore(
    subscribeToStoredTheme,
    getPaletteKeySnapshot,
    serverPaletteKey
  )
  const colorMode = useSyncExternalStore(
    subscribeToStoredTheme,
    getColorModeSnapshot,
    serverColorMode
  )
  const systemScheme = useSyncExternalStore(
    subscribeToSystemScheme,
    getSystemSchemeSnapshot,
    serverSystemScheme
  )

  const resolved: ResolvedColorMode = colorMode === 'system' ? systemScheme : colorMode

  // Push the choice onto <html>. The bootstrap script did this for the first
  // paint; this keeps it in step with every later change.
  useEffect(() => {
    applyTheme(paletteKey, resolved)
  }, [paletteKey, resolved])

  const setPalette = useCallback((key: string) => {
    writeStored(PALETTE_STORAGE_KEY, getPalette(key).key)
  }, [])

  const setColorMode = useCallback((mode: ColorMode) => {
    writeStored(COLOR_MODE_STORAGE_KEY, mode)
  }, [])

  const cyclePalette = useCallback(() => {
    const index = PALETTES.findIndex(p => p.key === paletteKey)
    const next = PALETTES[(index + 1) % PALETTES.length]
    setPalette(next.key)
    return next
  }, [paletteKey, setPalette])

  const cycleColorMode = useCallback(() => {
    const next = MODE_CYCLE[(MODE_CYCLE.indexOf(colorMode) + 1) % MODE_CYCLE.length]
    setColorMode(next)
    return next
  }, [colorMode, setColorMode])

  const value = useMemo<ThemeContextValue>(
    () => ({
      palette: getPalette(paletteKey),
      palettes: PALETTES,
      setPalette,
      cyclePalette,
      colorMode,
      setColorMode,
      cycleColorMode,
      resolved,
    }),
    [paletteKey, setPalette, cyclePalette, colorMode, setColorMode, cycleColorMode, resolved]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>')
  }
  return context
}
