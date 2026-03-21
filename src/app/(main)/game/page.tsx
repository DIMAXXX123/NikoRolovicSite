'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { Trophy, RotateCcw, Crown, Star, Zap } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────
type Cell = { filled: boolean; color: string; clearing?: boolean; justPlaced?: boolean }
type Shape = { cells: [number, number][]; color: string; name: string }
type Grid = Cell[][]
type LeaderEntry = { rank: number; name: string; classInfo: string; role: string; score: number; userId?: string }

// ── Constants ──────────────────────────────────────────────────────────
const GRID = 8

const COLORS = [
  '#FF3B3B', // vivid red
  '#4ADE80', // neon green
  '#FACC15', // electric yellow
  '#3B82F6', // bright blue
  '#A855F7', // purple
  '#FB923C', // orange
  '#22D3EE', // cyan
  '#EC4899', // pink
]

// All standard Block Blast shapes (no rotation — each orientation is a separate shape)
const SHAPE_DEFS: { cells: [number, number][]; name: string; weight: number }[] = [
  // Single
  { cells: [[0, 0]], name: 'dot', weight: 8 },
  // Horizontal bars
  { cells: [[0, 0], [0, 1]], name: '1x2', weight: 7 },
  { cells: [[0, 0], [0, 1], [0, 2]], name: '1x3', weight: 6 },
  { cells: [[0, 0], [0, 1], [0, 2], [0, 3]], name: '1x4', weight: 4 },
  { cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], name: '1x5', weight: 3 },
  // Vertical bars
  { cells: [[0, 0], [1, 0]], name: '2x1', weight: 7 },
  { cells: [[0, 0], [1, 0], [2, 0]], name: '3x1', weight: 6 },
  { cells: [[0, 0], [1, 0], [2, 0], [3, 0]], name: '4x1', weight: 4 },
  { cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], name: '5x1', weight: 3 },
  // 2x2 square
  { cells: [[0, 0], [0, 1], [1, 0], [1, 1]], name: '2x2', weight: 5 },
  // 3x3 square (rare)
  { cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]], name: '3x3', weight: 1 },
  // L-shapes (4 rotations)
  { cells: [[0, 0], [1, 0], [1, 1]], name: 'L1', weight: 5 },
  { cells: [[0, 0], [0, 1], [1, 0]], name: 'L2', weight: 5 },
  { cells: [[0, 0], [0, 1], [1, 1]], name: 'L3', weight: 5 },
  { cells: [[0, 1], [1, 0], [1, 1]], name: 'L4', weight: 5 },
  // Big L-shapes (4 rotations)
  { cells: [[0, 0], [1, 0], [2, 0], [2, 1]], name: 'bigL1', weight: 4 },
  { cells: [[0, 0], [0, 1], [0, 2], [1, 0]], name: 'bigL2', weight: 4 },
  { cells: [[0, 0], [0, 1], [1, 1], [2, 1]], name: 'bigL3', weight: 4 },
  { cells: [[0, 2], [1, 0], [1, 1], [1, 2]], name: 'bigL4', weight: 4 },
  // T-shapes (4 rotations)
  { cells: [[0, 0], [0, 1], [0, 2], [1, 1]], name: 'T1', weight: 4 },
  { cells: [[0, 0], [1, 0], [1, 1], [2, 0]], name: 'T2', weight: 4 },
  { cells: [[0, 1], [1, 0], [1, 1], [1, 2]], name: 'T3', weight: 4 },
  { cells: [[0, 0], [0, 1], [1, 0], [2, 0]], name: 'T4', weight: 4 },
  // S/Z shapes
  { cells: [[0, 0], [0, 1], [1, 1], [1, 2]], name: 'S1', weight: 4 },
  { cells: [[0, 1], [1, 0], [1, 1], [2, 0]], name: 'S2', weight: 4 },
  { cells: [[0, 1], [0, 2], [1, 0], [1, 1]], name: 'Z1', weight: 4 },
  { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], name: 'Z2', weight: 4 },
  // Corner pieces (2x2 with one missing)
  { cells: [[0, 0], [0, 1], [1, 0]], name: 'corner1', weight: 5 },
  { cells: [[0, 0], [0, 1], [1, 1]], name: 'corner2', weight: 5 },
  { cells: [[0, 0], [1, 0], [1, 1]], name: 'corner3', weight: 5 },
  { cells: [[0, 1], [1, 0], [1, 1]], name: 'corner4', weight: 5 },
]

// Weighted random selection
function randomShape(): Shape {
  const totalWeight = SHAPE_DEFS.reduce((s, d) => s + d.weight, 0)
  let r = Math.random() * totalWeight
  let def = SHAPE_DEFS[0]
  for (const d of SHAPE_DEFS) {
    r -= d.weight
    if (r <= 0) { def = d; break }
  }
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  return { cells: def.cells.map(c => [...c] as [number, number]), color, name: def.name }
}

function emptyGrid(): Grid {
  return Array.from({ length: GRID }, () =>
    Array.from({ length: GRID }, () => ({ filled: false, color: '' }))
  )
}

function canPlace(grid: Grid, shape: Shape, row: number, col: number): boolean {
  return shape.cells.every(([r, c]) => {
    const nr = row + r, nc = col + c
    return nr >= 0 && nr < GRID && nc >= 0 && nc < GRID && !grid[nr][nc].filled
  })
}

function canPlaceAnywhere(grid: Grid, shape: Shape): boolean {
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++)
      if (canPlace(grid, shape, r, c)) return true
  return false
}

function findNearestValidPosition(
  grid: Grid, shape: Shape, rawRow: number, rawCol: number, maxRadius = GRID
): { row: number; col: number } | null {
  // Check the raw position first
  if (canPlace(grid, shape, rawRow, rawCol)) return { row: rawRow, col: rawCol }
  // Search in expanding Manhattan distance
  for (let dist = 1; dist <= maxRadius; dist++) {
    let bestPos: { row: number; col: number } | null = null
    for (let dr = -dist; dr <= dist; dr++) {
      const dc_abs = dist - Math.abs(dr)
      for (const dc of dc_abs === 0 ? [0] : [-dc_abs, dc_abs]) {
        const nr = rawRow + dr
        const nc = rawCol + dc
        if (canPlace(grid, shape, nr, nc)) {
          if (!bestPos) bestPos = { row: nr, col: nc }
        }
      }
    }
    if (bestPos) return bestPos
  }
  return null
}

function getShapeBounds(shape: Shape) {
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity
  for (const [r, c] of shape.cells) {
    minR = Math.min(minR, r); maxR = Math.max(maxR, r)
    minC = Math.min(minC, c); maxC = Math.max(maxC, c)
  }
  return { rows: maxR - minR + 1, cols: maxC - minC + 1, minR, minC }
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16)
  const r = Math.max(0, (num >> 16) - amount)
  const g = Math.max(0, ((num >> 8) & 0x00FF) - amount)
  const b = Math.max(0, (num & 0x0000FF) - amount)
  return `rgb(${r},${g},${b})`
}

function isBoardEmpty(grid: Grid): boolean {
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++)
      if (grid[r][c].filled) return false
  return true
}

// ── LocalStorage helpers ───────────────────────────────────────────────
const LS_KEY = 'blockblast_highscore'
const LS_SCORES_KEY = 'blockblast_scores'

function getHighScore(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(LS_KEY) || '0', 10)
}

function saveHighScore(score: number) {
  const prev = getHighScore()
  if (score > prev) localStorage.setItem(LS_KEY, String(score))
}

const SEED_SCORES: LeaderEntry[] = [
  { rank: 1, name: 'Dmitrij Ivascenko', classInfo: '2-1', role: 'student', score: 2130 },
  { rank: 2, name: 'Ivan Siniukov', classInfo: '2-3', role: 'student', score: 1540 },
  { rank: 3, name: 'Timofej Masaidov', classInfo: '2-4', role: 'student', score: 1280 },
  { rank: 4, name: 'Stefan Vujovic', classInfo: '3-2', role: 'student', score: 1050 },
  { rank: 5, name: 'Lara Peric', classInfo: '1-2', role: 'student', score: 970 },
  { rank: 6, name: 'Nikola Popovic', classInfo: '4-1', role: 'student', score: 820 },
  { rank: 7, name: 'Danilo Dabanovic', classInfo: '3-1', role: 'student', score: 740 },
  { rank: 8, name: 'Milos Jokic', classInfo: '2-1', role: 'student', score: 680 },
  { rank: 9, name: 'Ana Markovic', classInfo: '1-3', role: 'student', score: 530 },
  { rank: 10, name: 'Kenan Hodzic', classInfo: '2-1', role: 'student', score: 450 },
]

const LS_RESET_KEY = 'bb_v2_reset'

function resetAndSeedScores() {
  if (typeof window === 'undefined') return
  if (!localStorage.getItem(LS_RESET_KEY)) {
    localStorage.removeItem(LS_KEY)
    localStorage.setItem(LS_SCORES_KEY, JSON.stringify(SEED_SCORES))
    localStorage.setItem(LS_RESET_KEY, '1')
  }
}

function getLocalScores(): LeaderEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LS_SCORES_KEY) || '[]')
  } catch { return [] }
}

function saveLocalScore(entry: LeaderEntry) {
  const scores = getLocalScores()
  scores.push(entry)
  scores.sort((a, b) => b.score - a.score)
  localStorage.setItem(LS_SCORES_KEY, JSON.stringify(scores.slice(0, 20)))
}

// ── Scoring ────────────────────────────────────────────────────────────
function calcLineScore(linesCleared: number): number {
  if (linesCleared === 0) return 0
  if (linesCleared === 1) return 10
  if (linesCleared === 2) return 30
  if (linesCleared === 3) return 60
  if (linesCleared === 4) return 100
  return 150 // 5+ lines
}

// ── Component ──────────────────────────────────────────────────────────
export default function BlockBlastPage() {
  // State
  const [grid, setGrid] = useState<Grid>(emptyGrid)
  const [shapes, setShapes] = useState<(Shape | null)[]>([])
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([])
  const [showLeaderboard, setShowLeaderboard] = useState(true)
  const [leaderLoading, setLeaderLoading] = useState(false)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [hoverPos, setHoverPos] = useState<{ row: number; col: number } | null>(null)
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set())
  const [newShapeAnim, setNewShapeAnim] = useState(false)
  const [comboFlash, setComboFlash] = useState(false)
  const [comboText, setComboText] = useState<{ value: number; id: number } | null>(null)

  // Refs
  const gridRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragShapeIdx = useRef<number | null>(null)
  const hoverPosRef = useRef<{ row: number; col: number } | null>(null)
  const scoreRef = useRef(score)
  const gridStateRef = useRef(grid)
  const shapesRef = useRef(shapes)
  const comboRef = useRef(combo)
  const comboIdRef = useRef(0)

  // Keep refs in sync
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { gridStateRef.current = grid }, [grid])
  useEffect(() => { shapesRef.current = shapes }, [shapes])
  useEffect(() => { comboRef.current = combo }, [combo])
  useEffect(() => { hoverPosRef.current = hoverPos }, [hoverPos])

  // ── Init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    resetAndSeedScores()
    setHighScore(getHighScore())
    startNewGame()
    // Pre-load leaderboard on page enter
    loadLeaderboard(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generateShapes = useCallback(() => {
    const s = [randomShape(), randomShape(), randomShape()]
    setShapes(s)
    shapesRef.current = s
    setNewShapeAnim(true)
    setTimeout(() => setNewShapeAnim(false), 400)
    return s
  }, [])

  const startNewGame = useCallback(() => {
    const g = emptyGrid()
    setGrid(g)
    gridStateRef.current = g
    setScore(0)
    scoreRef.current = 0
    setCombo(0)
    comboRef.current = 0
    setGameOver(false)
    setShaking(false)
    setSelectedIdx(null)
    setHoverPos(null)
    hoverPosRef.current = null
    setClearingCells(new Set())
    setComboText(null)
    generateShapes()
  }, [generateShapes])

  // ── Leaderboard ──────────────────────────────────────────────────────
  const loadLeaderboard = useCallback(async (currentScore: number) => {
    setLeaderLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setMyUserId(user.id)
      if (user && currentScore > 0) {
        const { data: existing } = await supabase
          .from('game_scores')
          .select('score')
          .eq('user_id', user.id)
          .single()
        if (!existing || currentScore > existing.score) {
          await supabase.from('game_scores').upsert(
            { user_id: user.id, score: currentScore },
            { onConflict: 'user_id' }
          )
        }
      }
      // Load ALL scores for full leaderboard
      const { data: scores } = await supabase
        .from('game_scores')
        .select('score, user_id')
        .order('score', { ascending: false })
        .limit(100)
      if (scores && scores.length > 0) {
        const entries: LeaderEntry[] = []
        for (const s of scores) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, class_number, section_number, role')
            .eq('id', s.user_id)
            .single()
          if (profile) {
            entries.push({
              rank: entries.length + 1,
              name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
              classInfo: `${profile.class_number || '?'}-${profile.section_number || '?'}`,
              role: (profile as Profile).role || 'student',
              score: s.score,
              userId: s.user_id,
            })
          }
        }
        setLeaderboard(entries)
      }
    } catch {
      const local = getLocalScores()
      if (local.length > 0) {
        setLeaderboard(local.slice(0, 100).map((e, i) => ({ ...e, rank: i + 1 })))
      }
    }
    saveLocalScore({ rank: 0, name: 'Ja', classInfo: '-', role: 'student', score: currentScore })
    setLeaderLoading(false)
  }, [])

  // ── Game Over ────────────────────────────────────────────────────────
  const triggerGameOver = useCallback((finalScore: number) => {
    setGameOver(true)
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
    saveHighScore(finalScore)
    setHighScore(Math.max(getHighScore(), finalScore))
    loadLeaderboard(finalScore)
  }, [loadLeaderboard])

  // ── Check game over ────────────────────────────────────────────────
  const checkGameOver = useCallback((gridToCheck: Grid, shapesToCheck: (Shape | null)[]) => {
    const remaining = shapesToCheck.filter(Boolean) as Shape[]
    if (remaining.length === 0) return
    const anyCanPlace = remaining.some(s => canPlaceAnywhere(gridToCheck, s))
    if (!anyCanPlace) {
      triggerGameOver(scoreRef.current)
    }
  }, [triggerGameOver])

  // ── Grid cell from screen coords ───────────────────────────────────
  const TOUCH_EXTEND = 100 // px beyond grid edges that still register

  const getCellFromPoint = useCallback((clientX: number, clientY: number): { row: number; col: number; near: boolean } | null => {
    if (!gridRef.current) return null
    const rect = gridRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const cellSize = rect.width / GRID
    // Check if within extended touch area
    const near = x >= -TOUCH_EXTEND && x <= rect.width + TOUCH_EXTEND &&
                 y >= -TOUCH_EXTEND && y <= rect.height + TOUCH_EXTEND
    if (!near) return null
    // Return extrapolated (possibly out-of-bounds) row/col so
    // findNearestValidPosition can search from the correct direction
    const col = Math.floor(x / cellSize)
    const row = Math.floor(y / cellSize)
    return { row, col, near: true }
  }, [])

  // ── Place block ──────────────────────────────────────────────────────
  const placeBlock = useCallback((shapeIdx: number, row: number, col: number) => {
    const shape = shapesRef.current[shapeIdx]
    const currentGrid = gridStateRef.current
    if (!shape || !canPlace(currentGrid, shape, row, col)) return false

    const newGrid = currentGrid.map(r => r.map(c => ({ ...c, justPlaced: false })))

    // Place cells
    shape.cells.forEach(([r, c]) => {
      newGrid[row + r][col + c] = { filled: true, color: shape.color, justPlaced: true }
    })

    // Check clears
    const clearRows: number[] = []
    const clearCols: number[] = []
    for (let i = 0; i < GRID; i++) {
      if (newGrid[i].every(cell => cell.filled)) clearRows.push(i)
      if (newGrid.every(r => r[i].filled)) clearCols.push(i)
    }
    const linesCleared = clearRows.length + clearCols.length

    let newCombo = comboRef.current

    if (linesCleared > 0) {
      // Combo increases by 1 per placement that clears lines (not per line)
      newCombo += 1

      // Scoring: base points for cells + line clear bonus with combo multiplier
      const comboMultiplier = Math.max(1, newCombo)
      let pts_lines = linesCleared * 100 * comboMultiplier
      // Bonus for multi-line clears
      if (linesCleared >= 2) pts_lines += linesCleared * 200 * comboMultiplier
      if (linesCleared >= 3) pts_lines += 1000 * comboMultiplier
      if (linesCleared >= 4) pts_lines += 3000 * comboMultiplier

      const pts_cells = shape.cells.length * 10
      const pts_total = pts_cells + pts_lines

      // Show combo text
      if (newCombo >= 2) {
        const cid = ++comboIdRef.current
        setComboText({ value: newCombo, id: cid })
        setTimeout(() => setComboText(prev => prev?.id === cid ? null : prev), 1200)
      }
      setComboFlash(true)
      setTimeout(() => setComboFlash(false), 400)

      // Clearing animation
      const clearing = new Set<string>()
      clearRows.forEach(r => { for (let c = 0; c < GRID; c++) clearing.add(`${r}-${c}`) })
      clearCols.forEach(c => { for (let r = 0; r < GRID; r++) clearing.add(`${r}-${c}`) })
      setClearingCells(clearing)

      // Screen shake on multi-line
      if (linesCleared >= 2) {
        setShaking(true)
        setTimeout(() => setShaking(false), 200)
      }

      setScore(prev => {
        const newScore = prev + pts_total
        scoreRef.current = newScore
        return newScore
      })

      // Clear cells after animation
      setTimeout(() => {
        setGrid(prev => {
          const g = prev.map(r => r.map(c => ({ ...c })))
          clearRows.forEach(r => { for (let c = 0; c < GRID; c++) g[r][c] = { filled: false, color: '' } })
          clearCols.forEach(c => { for (let r = 0; r < GRID; r++) g[r][c] = { filled: false, color: '' } })

          // Board clear bonus
          if (isBoardEmpty(g)) {
            setScore(prev2 => {
              const ns = prev2 + 500
              scoreRef.current = ns
              return ns
            })
          }

          gridStateRef.current = g

          // Check game over after clear
          const remainingAfterClear = shapesRef.current.filter(Boolean) as Shape[]
          if (remainingAfterClear.length > 0) {
            const anyFit = remainingAfterClear.some(s => canPlaceAnywhere(g, s))
            if (!anyFit) triggerGameOver(scoreRef.current)
          }

          return g
        })
        setClearingCells(new Set())
      }, 300)
    } else {
      // No lines cleared — combo resets to 0
      newCombo = 0

      // Points just for placing cells (no combo bonus)
      const pts_cells = shape.cells.length * 10
      setScore(prev => {
        const newScore = prev + pts_cells
        scoreRef.current = newScore
        return newScore
      })
    }

    setCombo(newCombo)
    comboRef.current = newCombo
    setGrid(newGrid)
    gridStateRef.current = newGrid

    // Remove used shape
    const newShapes = [...shapesRef.current]
    newShapes[shapeIdx] = null
    setShapes(newShapes)
    shapesRef.current = newShapes

    // If all 3 placed, generate new batch (combo persists across batches!)
    const remaining = newShapes.filter(Boolean) as Shape[]
    if (remaining.length === 0) {
      const delay = linesCleared > 0 ? 400 : 150
      setTimeout(() => {
        const fresh = generateShapes()
        setTimeout(() => {
          checkGameOver(gridStateRef.current, fresh)
        }, 50)
      }, delay)
    } else if (linesCleared === 0) {
      // Check immediately if no lines to clear
      checkGameOver(newGrid, newShapes)
    }
    // If lines are clearing, game over check happens in the setTimeout above

    setSelectedIdx(null)
    setHoverPos(null)
    hoverPosRef.current = null
    return true
  }, [generateShapes, checkGameOver, triggerGameOver])

  // ── Touch handlers ──────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent, idx: number) => {
    if (gameOver || !shapes[idx]) return
    e.stopPropagation()
    isDragging.current = true
    dragShapeIdx.current = idx
    setSelectedIdx(idx)
  }, [gameOver, shapes])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || dragShapeIdx.current === null) return
    e.preventDefault()
    const touch = e.touches[0]
    const shape = shapesRef.current[dragShapeIdx.current]
    if (!shape) return
    const bounds = getShapeBounds(shape)
    // Apply 80px vertical offset, then get grid cell (extended area included)
    const pos = getCellFromPoint(touch.clientX, touch.clientY - 80)
    if (pos) {
      // Center shape on finger — pass raw (unclamped) position so
      // findNearestValidPosition searches from the true finger location
      const adjRow = pos.row - Math.floor(bounds.rows / 2)
      const adjCol = pos.col - Math.floor(bounds.cols / 2)
      // Find nearest valid position (magnetic snap)
      const snapped = findNearestValidPosition(gridStateRef.current, shape, adjRow, adjCol)
      if (snapped) {
        setHoverPos(snapped)
        hoverPosRef.current = snapped
      } else {
        setHoverPos(null)
        hoverPosRef.current = null
      }
    } else {
      // Finger too far from grid — hide preview
      setHoverPos(null)
      hoverPosRef.current = null
    }
  }, [getCellFromPoint])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || dragShapeIdx.current === null) return
    const hp = hoverPosRef.current
    const idx = dragShapeIdx.current
    if (hp !== null && idx !== null) {
      // hoverPos is always a valid position (magnetic snap ensures this)
      placeBlock(idx, hp.row, hp.col)
    }
    isDragging.current = false
    dragShapeIdx.current = null
    setHoverPos(null)
    hoverPosRef.current = null
  }, [placeBlock])

  // ── Mouse drag handlers (like touch but for mouse) ───────────────────
  const handleMouseDragStart = useCallback((e: React.MouseEvent, idx: number) => {
    if (gameOver || !shapes[idx]) return
    e.preventDefault()
    isDragging.current = true
    dragShapeIdx.current = idx
    setSelectedIdx(idx)
  }, [gameOver, shapes])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || dragShapeIdx.current === null) return
    const shape = shapesRef.current[dragShapeIdx.current]
    if (!shape) return
    const bounds = getShapeBounds(shape)
    const pos = getCellFromPoint(e.clientX, e.clientY)
    if (pos) {
      const adjRow = pos.row - Math.floor(bounds.rows / 2)
      const adjCol = pos.col - Math.floor(bounds.cols / 2)
      const snapped = findNearestValidPosition(gridStateRef.current, shape, adjRow, adjCol)
      setHoverPos(snapped)
      hoverPosRef.current = snapped
    } else {
      setHoverPos(null)
      hoverPosRef.current = null
    }
  }, [getCellFromPoint])

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current || dragShapeIdx.current === null) return
    const hp = hoverPosRef.current
    const idx = dragShapeIdx.current
    if (hp !== null && idx !== null) {
      placeBlock(idx, hp.row, hp.col)
    }
    isDragging.current = false
    dragShapeIdx.current = null
    setHoverPos(null)
    hoverPosRef.current = null
  }, [placeBlock])

  // ── Mouse handlers for grid ─────────────────────────────────────────
  const handleGridMouseMove = useCallback((e: React.MouseEvent) => {
    if (selectedIdx === null || !shapes[selectedIdx]) return
    const pos = getCellFromPoint(e.clientX, e.clientY)
    if (pos) {
      const shape = shapes[selectedIdx]!
      const bounds = getShapeBounds(shape)
      const adjRow = pos.row - Math.floor(bounds.rows / 2)
      const adjCol = pos.col - Math.floor(bounds.cols / 2)
      const snapped = findNearestValidPosition(grid, shape, adjRow, adjCol)
      setHoverPos(snapped)
    } else {
      setHoverPos(null)
    }
  }, [selectedIdx, shapes, grid, getCellFromPoint])

  const handleGridMouseLeave = useCallback(() => {
    setHoverPos(null)
  }, [])

  const handleGridClick = useCallback((e: React.MouseEvent) => {
    if (selectedIdx === null || !shapes[selectedIdx] || gameOver) return
    const pos = getCellFromPoint(e.clientX, e.clientY)
    if (!pos) return
    const shape = shapes[selectedIdx]!
    const bounds = getShapeBounds(shape)
    const adjRow = pos.row - Math.floor(bounds.rows / 2)
    const adjCol = pos.col - Math.floor(bounds.cols / 2)
    const snapped = findNearestValidPosition(grid, shape, adjRow, adjCol)
    if (snapped) {
      placeBlock(selectedIdx, snapped.row, snapped.col)
    }
  }, [selectedIdx, shapes, grid, gameOver, getCellFromPoint, placeBlock])

  // ── Ghost cells (preview) ────────────────────────────────────────────
  const ghostInfo = useMemo(() => {
    if (selectedIdx === null || !hoverPos || !shapes[selectedIdx]) return { cells: new Set<string>(), valid: false }
    const shape = shapes[selectedIdx]!
    const s = new Set<string>()
    shape.cells.forEach(([r, c]) => s.add(`${hoverPos.row + r}-${hoverPos.col + c}`))
    // hoverPos is always a valid position thanks to magnetic snapping
    return { cells: s, valid: true }
  }, [selectedIdx, hoverPos, shapes])

  const ghostColor = selectedIdx !== null && shapes[selectedIdx] ? shapes[selectedIdx]!.color : '#a78bfa'

  // ── Role badge ───────────────────────────────────────────────────────
  const roleBadge = (role: string) => {
    const badges: Record<string, { label: string; cls: string }> = {
      creator: { label: '👑', cls: 'text-yellow-400' },
      admin: { label: '⚡', cls: 'text-red-400' },
      moderator: { label: '🛡️', cls: 'text-blue-400' },
      student: { label: '📚', cls: 'text-gray-400' },
    }
    return badges[role] || badges.student
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div
      className={`overflow-hidden select-none ${shaking ? 'animate-shake' : ''}`}
      onTouchMove={handleTouchMove as unknown as React.TouchEventHandler<HTMLDivElement>}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ touchAction: 'none' }}
    >
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px) rotate(-0.3deg); }
          75% { transform: translateX(2px) rotate(0.3deg); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out; }

        @keyframes clearFlash {
          0% { opacity: 1; transform: scale(1); background-color: inherit; }
          40% { opacity: 1; transform: scale(1.05); background-color: white !important; }
          100% { opacity: 0; transform: scale(0.8); }
        }
        .cell-clearing { animation: clearFlash 0.3s ease-out forwards; }

        @keyframes scaleIn {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .shape-appear { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        @keyframes cellPlace {
          0% { transform: scale(0.6); opacity: 0.7; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .cell-placed { animation: cellPlace 0.15s ease-out; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(168,85,247,0.4); }
          50% { box-shadow: 0 0 12px 4px rgba(168,85,247,0.2); }
        }
        .selected-shape { animation: pulseGlow 1.5s ease-in-out infinite; }

        @keyframes ghostPulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.55; }
        }
        .ghost-cell { animation: ghostPulse 0.8s ease-in-out infinite; }

        @keyframes comboPopup {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          30% { opacity: 1; transform: translateY(-10px) scale(1.3); }
          60% { transform: translateY(-20px) scale(1); }
          100% { opacity: 0; transform: translateY(-40px) scale(0.8); }
        }
        .combo-popup { animation: comboPopup 1.2s ease-out forwards; pointer-events: none; }

        @keyframes comboFlashKf {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .combo-flash { animation: comboFlashKf 0.3s ease-out; }

        @keyframes gameOverTitle {
          0% { opacity: 0; transform: scale(0.5); }
          60% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        .game-over-title { animation: gameOverTitle 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>

      {/* Score Header */}
      <div className="text-center mb-3 mt-1">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Score</p>
            <p className={`text-2xl font-bold text-white tabular-nums ${comboFlash ? 'combo-flash' : ''}`}>
              {score}
            </p>
          </div>
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full border ${comboFlash ? 'combo-flash' : ''}`}
            style={{
              background: combo >= 1 ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.05)',
              borderColor: combo >= 1 ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.1)',
              boxShadow: combo >= 1 ? '0 0 12px rgba(168,85,247,0.2)' : 'none',
            }}
          >
            <Zap className={`w-3.5 h-3.5 ${combo >= 1 ? 'text-purple-400' : 'text-zinc-500'}`} />
            <span className={`text-sm font-black ${combo >= 1 ? 'text-purple-300' : 'text-zinc-500'}`}>
              x{combo >= 1 ? combo : 1}
            </span>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Best</p>
            <p className="text-lg font-semibold text-zinc-400 tabular-nums">{highScore}</p>
          </div>
          <button
            onClick={() => { setShowLeaderboard(!showLeaderboard); if (!showLeaderboard) loadLeaderboard(score) }}
            className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 active:scale-90 transition-all hover:bg-amber-500/25"
            title="Tabela lidera"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Combo popup above score */}
      {comboText && (
        <div key={comboText.id} className="combo-popup text-center text-lg font-black text-purple-300"
          style={{ textShadow: '0 0 12px rgba(168,85,247,0.6)' }}
        >
          x{comboText.value} COMBO!
        </div>
      )}

      {/* Leaderboard overlay */}
      {showLeaderboard && !gameOver && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowLeaderboard(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 w-full max-w-sm space-y-3 fade-in-up max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2"><Trophy className="w-5 h-5" /> Tabela lidera</h3>
              <button onClick={() => setShowLeaderboard(false)} className="text-zinc-500 hover:text-white text-sm">✕</button>
            </div>
            {leaderLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                  <span className="absolute inset-0 flex items-center justify-center text-lg">🏆</span>
                </div>
                <p className="text-sm text-zinc-400 animate-pulse">Učitavanje tabele...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="text-center text-zinc-500 py-4">Nema rezultata</p>
            ) : (
              <>
                <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
                  {leaderboard.map((e, i) => {
                    const isMe = myUserId && e.userId === myUserId
                    return (
                      <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isMe ? 'bg-purple-500/20 border border-purple-500/40 ring-1 ring-purple-500/30' : i === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-zinc-800/50'}`}>
                        <span className={`text-sm font-bold w-6 ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-orange-400' : isMe ? 'text-purple-400' : 'text-zinc-500'}`}>#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isMe ? 'text-purple-300' : ''}`}>{e.name} {isMe ? '← ti' : ''}</p>
                          <p className="text-[10px] text-zinc-500">{e.classInfo}</p>
                        </div>
                        <span className={`text-sm font-bold ${isMe ? 'text-purple-300' : 'text-zinc-300'}`}>{e.score.toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
                {/* Your position summary if not in top 3 */}
                {myUserId && (() => {
                  const myIdx = leaderboard.findIndex(e => e.userId === myUserId)
                  if (myIdx >= 3) {
                    return (
                      <div className="mt-2 px-3 py-2 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-between">
                        <span className="text-xs text-purple-300">Tvoje mjesto</span>
                        <span className="text-sm font-bold text-purple-400">#{myIdx + 1} od {leaderboard.length}</span>
                      </div>
                    )
                  }
                  return null
                })()}
              </>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="relative mx-auto w-full" style={{ maxWidth: '360px' }}>
        <div
          ref={gridRef}
          className="grid rounded-xl p-[2px] border w-full mx-auto"
          style={{
            gridTemplateColumns: `repeat(${GRID}, 1fr)`,
            gap: '1px',
            aspectRatio: '1/1',
            maxWidth: '352px',
            maxHeight: '352px',
            background: '#111827',
            borderColor: 'rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4), 0 4px 20px rgba(0,0,0,0.3)',
          }}
          onMouseMove={handleGridMouseMove}
          onMouseLeave={handleGridMouseLeave}
          onClick={handleGridClick}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const key = `${r}-${c}`
              const isGhost = ghostInfo.cells.has(key)
              const isClearing = clearingCells.has(key)
              return (
                <div
                  key={key}
                  className={`
                    aspect-square rounded-[2px]
                    ${cell.filled && cell.justPlaced ? 'cell-placed' : ''}
                    ${isClearing ? 'cell-clearing' : ''}
                    ${isGhost ? 'ghost-cell' : ''}
                  `}
                  style={{
                    backgroundColor: cell.filled
                      ? cell.color
                      : isGhost
                        ? `${ghostColor}44`
                        : 'rgba(255,255,255,0.02)',
                    ...(cell.filled ? {
                      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.08) 35%, transparent 55%)',
                      boxShadow: `inset 0 1px 0 ${darkenColor(cell.color, -40)}, inset 0 -1px 0 ${darkenColor(cell.color, 60)}, inset 1px 0 0 ${darkenColor(cell.color, -25)}, inset -1px 0 0 ${darkenColor(cell.color, 45)}`,
                      borderRadius: '2px',
                    } : {
                      border: '1px solid rgba(255,255,255,0.03)',
                    }),
                    ...(isGhost ? {
                      border: `1px solid ${ghostColor}66`,
                      borderRadius: '2px',
                    } : {}),
                  }}
                />
              )
            })
          )}
        </div>
      </div>

      {/* Shapes tray */}
      <div className="mt-4 flex items-center justify-center gap-4">
        {shapes.map((shape, idx) => {
          if (!shape) return <div key={idx} className="w-[88px] h-[88px]" />
          const bounds = getShapeBounds(shape)
          const isSelected = selectedIdx === idx
          const cellPx = Math.min(18, Math.floor(72 / Math.max(bounds.rows, bounds.cols)))
          return (
            <button
              key={idx}
              className={`
                relative p-3 rounded-xl transition-all duration-200 min-w-[88px] min-h-[88px]
                flex items-center justify-center
                ${isSelected
                  ? 'selected-shape bg-zinc-700/70 scale-110 border-2 border-purple-500/50'
                  : 'bg-zinc-800/50 hover:bg-zinc-700/50 hover:scale-105 border border-zinc-700/30 hover:border-zinc-500/40'}
                ${newShapeAnim ? 'shape-appear' : ''}
                active:scale-95
              `}
              style={{ animationDelay: newShapeAnim ? `${idx * 80}ms` : undefined }}
              onClick={() => setSelectedIdx(isSelected ? null : idx)}
              onTouchStart={(e) => handleTouchStart(e, idx)}
              onMouseDown={(e) => handleMouseDragStart(e, idx)}
            >
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${bounds.cols}, ${cellPx}px)`,
                  gridTemplateRows: `repeat(${bounds.rows}, ${cellPx}px)`,
                  gap: '2px',
                }}
              >
                {Array.from({ length: bounds.rows * bounds.cols }, (_, i) => {
                  const r = Math.floor(i / bounds.cols)
                  const c = i % bounds.cols
                  const isFilled = shape.cells.some(([sr, sc]) => sr - bounds.minR === r && sc - bounds.minC === c)
                  return (
                    <div
                      key={i}
                      className="rounded-[2px]"
                      style={{
                        width: cellPx,
                        height: cellPx,
                        backgroundColor: isFilled ? shape.color : 'transparent',
                        ...(isFilled ? {
                          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.08) 35%, transparent 55%)',
                          boxShadow: `inset 0 1px 0 ${darkenColor(shape.color, -40)}, inset 0 -1px 0 ${darkenColor(shape.color, 60)}, inset 1px 0 0 ${darkenColor(shape.color, -25)}, inset -1px 0 0 ${darkenColor(shape.color, 45)}`,
                        } : {}),
                      }}
                    />
                  )
                })}
              </div>
            </button>
          )
        })}
      </div>

      {selectedIdx !== null && (
        <p className="text-center text-[11px] text-zinc-500 mt-2">
          Tap on grid to place • Tap shape again to deselect
        </p>
      )}

      {/* Game Over Overlay */}
      {gameOver && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="fade-in-up bg-zinc-900/95 border border-zinc-600 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            style={{ boxShadow: '0 0 60px rgba(168,85,247,0.15), 0 20px 40px rgba(0,0,0,0.5)' }}
          >
            <div className="text-center mb-5">
              <h2 className="game-over-title text-3xl font-black text-white mb-2">
                Kraj igre!
              </h2>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span className="text-4xl font-black bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300 bg-clip-text text-transparent">
                  {score}
                </span>
              </div>
              {score >= highScore && score > 0 && (
                <p className="text-sm text-purple-400 mt-1 flex items-center justify-center gap-1 font-semibold">
                  <Star className="w-4 h-4 fill-purple-400" /> Novi rekord!
                </p>
              )}
            </div>

            {leaderboard.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Leaderboard
                </h3>
                <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                  {leaderboard.map((entry, i) => {
                    const badge = roleBadge(entry.role)
                    const isMe = myUserId && entry.userId === myUserId
                    return (
                      <div key={i} className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm ${
                        isMe ? 'bg-purple-500/20 border border-purple-500/40 ring-1 ring-purple-500/30' : i === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-zinc-800/60'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-5 text-right font-mono text-xs ${
                            i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-orange-400' : isMe ? 'text-purple-400' : 'text-zinc-500'
                          }`}>
                            {i + 1}.
                          </span>
                          <span className={badge.cls}>{badge.label}</span>
                          <span className={`truncate max-w-[120px] ${isMe ? 'text-purple-300' : 'text-white'}`}>{entry.name}{isMe ? ' ←' : ''}</span>
                          <span className="text-zinc-600 text-xs">{entry.classInfo}</span>
                        </div>
                        <span className={`font-semibold tabular-nums ${isMe ? 'text-purple-300' : 'text-purple-300'}`}>{entry.score.toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
                {/* Your position if not top 3 */}
                {myUserId && (() => {
                  const myIdx = leaderboard.findIndex(e => e.userId === myUserId)
                  if (myIdx >= 3) {
                    return (
                      <div className="mt-2 px-3 py-2 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-between">
                        <span className="text-xs text-purple-300">Tvoje mjesto</span>
                        <span className="text-sm font-bold text-purple-400">#{myIdx + 1} od {leaderboard.length}</span>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            )}

            <button
              onClick={startNewGame}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 active:scale-95 transition-all rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg"
              style={{ boxShadow: '0 4px 15px rgba(168,85,247,0.4)' }}
            >
              <RotateCcw className="w-5 h-5" />
              Igraj ponovo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
