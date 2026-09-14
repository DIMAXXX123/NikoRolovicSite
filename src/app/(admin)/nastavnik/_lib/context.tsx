'use client'

import { createContext, useContext } from 'react'
import type { DirektorPeriod } from '@/lib/direktor-types'

export interface NastavnikShellState {
  period: DirektorPeriod
  setPeriod: (p: DirektorPeriod) => void
  /** Author picked in the header (picker roles only); null = the viewer. */
  author: string | null
  setAuthor: (id: string | null) => void
  /** Viewer's own role (profiles.role). */
  role: string
  canPick: boolean
}

export const NastavnikContext = createContext<NastavnikShellState | null>(null)

export function useNastavnikShell(): NastavnikShellState {
  const ctx = useContext(NastavnikContext)
  if (!ctx) throw new Error('useNastavnikShell outside <NastavnikLayout>')
  return ctx
}
