'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { Trophy, RotateCcw, Crown, Star, Zap } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────
type Cell = { filled: boolean; color: string; clearing?: boolean; justPlaced?: boolean }
type Shape = { cells: [number, number][]; color: string; name: string }
type Grid = Cell[][]
type ScorePopup = { id: number; x: number; y: number; value: number; ts: number }
type LeaderEntry = { rank: number; name: string; classInfo: string; role: string; score: number }
type Particle = { id: number; x: number; y: number; color: string; angle: number; speed: number; size: number }

// ── Constants ──────────────────────────────────────────────────────────
const GRID = 8
// Vivid, high-contrast Block Blast colors
const COLORS = [
  '#FF3D00', // vivid red-orange
  '#00E676', // neon green
  '#FFEA00', // electric yellow
  '#FF1744', // hot red
  '#7C4DFF', // deep purple
  '#00B0FF', // bright blue
  '#FF6D00', // bright orange
  '#E040FB', // magenta
  '#00E5FF', // cyan
  '#76FF03', // lime
]

const SHAPE_DEFS: { cells: [number, number][]; name: string }[] = [
  { cells: [[0, 0]], name: 'dot' },
  { cells: [[0, 0], [0, 1]], name: '2h' },
  { cells: [[0, 0], [1, 0]], name: '2v' },
  { cells: [[0, 0], [0, 1], [0, 2]], name: '3h' },
  { cells: [[0, 0], [1, 0], [2, 0]], name: '3v' },
  { cells: [[0, 0], [0, 1], [1, 0]], name: 'L' },
  { cells: [[0, 0], [0, 1], [0, 2], [1, 1]], name: 'T' },
  { cells: [[0, 0], [0, 1], [1, 0], [1, 1]], name: 'sq' },
  { cells: [[0, 0], [0, 1], [1, 1], [1, 2]], name: 'Z' },
  { cells: [[0, 1], [0, 2], [1, 0], [1, 1]], name: 'S' },
  { cells: [[0, 0], [1, 0], [1, 1]], name: 'L2' },
  { cells: [[0, 0], [0, 1], [0, 2], [0, 3]], name: '4h' },
  { cells: [[0, 0], [1, 0], [2, 0], [3, 0]], name: '4v' },
  { cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2]], name: '3x3frame' },
  { cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], name: '3x3' },
]

function randomShape(): Shape {
  const def = SHAPE_DEFS[Math.floor(Math.random() * SHAPE_DEFS.length)]
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

function getShapeBounds(shape: Shape) {
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity
  for (const [r, c] of shape.cells) {
    minR = Math.min(minR, r); maxR = Math.max(maxR, r)
    minC = Math.min(minC, c); maxC = Math.max(maxC, c)
  }
  return { rows: maxR - minR + 1, cols: maxC - minC + 1, minR, minC }
}

// Darken a hex color for borders
function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16)
  const r = Math.max(0, (num >> 16) - amount)
  const g = Math.max(0, ((num >> 8) & 0x00FF) - amount)
  const b = Math.max(0, (num & 0x0000FF) - amount)
  return `rgb(${r},${g},${b})`
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

// ── Component ──────────────────────────────────────────────────────────
export default function BlockBlastPage() {
  const [grid, setGrid] = useState<Grid>(emptyGrid)
  const [shapes, setShapes] = useState<(Shape | null)[]>([])
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [popups, setPopups] = useState<ScorePopup[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [hoverPos, setHoverPos] = useState<{ row: number; col: number } | null>(null)
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set())
  const [newShapeAnim, setNewShapeAnim] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const [comboFlash, setComboFlash] = useState(false)

  const gridRef = useRef<HTMLDivElement>(null)
  const popupId = useRef(0)
  const particleId = useRef(0)
  const isDragging = useRef(false)
  const dragShapeIdx = useRef<number | null>(null)
  const hoverPosRef = useRef<{ row: number; col: number } | null>(null)
  // Refs for latest state to avoid stale closures
  const scoreRef = useRef(score)
  const gridRefState = useRef(grid)
  const shapesRef = useRef(shapes)

  // Keep refs in sync
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { gridRefState.current = grid }, [grid])
  useEffect(() => { shapesRef.current = shapes }, [shapes])
  useEffect(() => { hoverPosRef.current = hoverPos }, [hoverPos])

  // ── Init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setHighScore(getHighScore())
    startNewGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generateShapes = useCallback(() => {
    const s = [randomShape(), randomShape(), randomShape()]
    setShapes(s)
    setNewShapeAnim(true)
    setTimeout(() => setNewShapeAnim(false), 400)
    return s
  }, [])

  const startNewGame = useCallback(() => {
    setGrid(emptyGrid())
    setScore(0)
    setCombo(0)
    setGameOver(false)
    setShaking(false)
    setPopups([])
    setParticles([])
    setSelectedIdx(null)
    setHoverPos(null)
    setClearingCells(new Set())
    generateShapes()
  }, [generateShapes])

  // ── Add popup ────────────────────────────────────────────────────────
  const addPopup = useCallback((x: number, y: number, value: number) => {
    const id = ++popupId.current
    setPopups(prev => [...prev, { id, x, y, value, ts: Date.now() }])
    setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 1200)
  }, [])

  // ── Spawn particles ─────────────────────────────────────────────────
  const spawnParticles = useCallback((cells: [number, number][], color: string) => {
    if (!gridRef.current) return
    const cellSize = gridRef.current.offsetWidth / GRID
    const newParticles: Particle[] = []
    for (const [r, c] of cells) {
      const cx = c * cellSize + cellSize / 2
      const cy = r * cellSize + cellSize / 2
      for (let i = 0; i < 3; i++) {
        newParticles.push({
          id: ++particleId.current,
          x: cx,
          y: cy,
          color,
          angle: Math.random() * 360,
          speed: 1 + Math.random() * 2,
          size: 3 + Math.random() * 4,
        })
      }
    }
    setParticles(prev => [...prev, ...newParticles])
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)))
    }, 800)
  }, [])

  // ── Game Over ────────────────────────────────────────────────────────
  const triggerGameOver = useCallback((finalScore: number) => {
    setGameOver(true)
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
    saveHighScore(finalScore)
    setHighScore(Math.max(getHighScore(), finalScore))
    loadLeaderboard(finalScore)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Check game over (uses refs to avoid stale state) ────────────────
  const checkGameOver = useCallback((gridToCheck: Grid, shapesToCheck: (Shape | null)[]) => {
    const remaining = shapesToCheck.filter(Boolean) as Shape[]
    if (remaining.length === 0) return
    const anyCanPlace = remaining.some(s => canPlaceAnywhere(gridToCheck, s))
    if (!anyCanPlace) {
      triggerGameOver(scoreRef.current)
    }
  }, [triggerGameOver])

  // ── Place block ──────────────────────────────────────────────────────
  const placeBlock = useCallback((shapeIdx: number, row: number, col: number) => {
    const shape = shapesRef.current[shapeIdx]
    const currentGrid = gridRefState.current
    if (!shape || !canPlace(currentGrid, shape, row, col)) return false

    const newGrid = currentGrid.map(r => r.map(c => ({ ...c, justPlaced: false })))

    // Place
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

    // Calculate points
    let pts = shape.cells.length * 10
    let newCombo = combo

    if (linesCleared > 0) {
      newCombo += 1
      const multiplier = Math.min(newCombo, 5)
      pts += linesCleared * 50 * multiplier

      // Combo flash
      setComboFlash(true)
      setTimeout(() => setComboFlash(false), 400)

      // Collect clearing cells for particles
      const clearCellCoords: [number, number][] = []
      const clearing = new Set<string>()
      clearRows.forEach(r => {
        for (let c = 0; c < GRID; c++) {
          clearing.add(`${r}-${c}`)
          clearCellCoords.push([r, c])
        }
      })
      clearCols.forEach(c => {
        for (let r = 0; r < GRID; r++) {
          clearing.add(`${r}-${c}`)
          clearCellCoords.push([r, c])
        }
      })
      setClearingCells(clearing)

      // Spawn particles from cleared cells
      const particleColor = shape.color
      spawnParticles(clearCellCoords.slice(0, 24), particleColor)

      // Screen shake
      setShaking(true)
      setTimeout(() => setShaking(false), 300)

      // After animation, actually clear the cells
      setTimeout(() => {
        setGrid(prev => {
          const g = prev.map(r => r.map(c => ({ ...c })))
          clearRows.forEach(r => {
            for (let c = 0; c < GRID; c++) g[r][c] = { filled: false, color: '' }
          })
          clearCols.forEach(c => {
            for (let r = 0; r < GRID; r++) g[r][c] = { filled: false, color: '' }
          })
          return g
        })
        setClearingCells(new Set())
      }, 400)
    } else {
      newCombo = 0
    }

    setCombo(newCombo)
    setGrid(newGrid)
    setScore(prev => {
      const newScore = prev + pts
      scoreRef.current = newScore
      return newScore
    })

    // Popup
    if (gridRef.current) {
      const cellSize = gridRef.current.offsetWidth / GRID
      addPopup(col * cellSize + cellSize / 2, row * cellSize, pts)
    }

    // Remove used shape
    const newShapes = [...shapesRef.current]
    newShapes[shapeIdx] = null
    setShapes(newShapes)

    // If all shapes used, generate new batch
    const remaining = newShapes.filter(Boolean) as Shape[]
    if (remaining.length === 0) {
      const delay = linesCleared > 0 ? 500 : 150
      setTimeout(() => {
        const fresh = generateShapes()
        // Check game over with the post-clear grid
        setTimeout(() => {
          checkGameOver(gridRefState.current, fresh)
        }, 100)
      }, delay)
    } else {
      // Check if remaining shapes can be placed (after lines clear)
      const delay = linesCleared > 0 ? 500 : 100
      setTimeout(() => {
        checkGameOver(gridRefState.current, newShapes)
      }, delay)
    }

    setSelectedIdx(null)
    setHoverPos(null)
    return true
  }, [combo, addPopup, generateShapes, spawnParticles, checkGameOver])

  // ── Leaderboard ──────────────────────────────────────────────────────
  const loadLeaderboard = useCallback(async (currentScore: number) => {
    try {
      const supabase = createClient()

      // Save score to DB
      const { data: { user } } = await supabase.auth.getUser()
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

      // Load top 10 scores with profiles
      const { data: scores } = await supabase
        .from('game_scores')
        .select('score, user_id')
        .order('score', { ascending: false })
        .limit(10)

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
            })
          }
        }
        setLeaderboard(entries)
      }
    } catch {
      const local = getLocalScores()
      if (local.length > 0) {
        setLeaderboard(local.slice(0, 10).map((e, i) => ({ ...e, rank: i + 1 })))
      }
    }

    // Save locally
    saveLocalScore({
      rank: 0,
      name: 'Ja',
      classInfo: '-',
      role: 'student',
      score: currentScore,
    })
  }, [])

  // ── Grid cell position ───────────────────────────────────────────────
  const getCellFromPoint = useCallback((clientX: number, clientY: number, clamp = false): { row: number; col: number } | null => {
    if (!gridRef.current) return null
    const rect = gridRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const cellSize = rect.width / GRID
    let col = Math.floor(x / cellSize)
    let row = Math.floor(y / cellSize)
    if (clamp) {
      row = Math.max(0, Math.min(GRID - 1, row))
      col = Math.max(0, Math.min(GRID - 1, col))
    } else {
      if (row < 0 || row >= GRID || col < 0 || col >= GRID) return null
    }
    return { row, col }
  }, [])

  // ── Clamp shape so it stays within grid bounds ──────────────────────
  const clampShapePos = useCallback((row: number, col: number, shape: Shape) => {
    const bounds = getShapeBounds(shape)
    return {
      row: Math.max(0, Math.min(GRID - bounds.rows, row)),
      col: Math.max(0, Math.min(GRID - bounds.cols, col)),
    }
  }, [])

  // ── Touch / Mouse handlers for grid ──────────────────────────────────
  const handleGridClick = useCallback((row: number, col: number) => {
    if (selectedIdx === null || gameOver) return
    placeBlock(selectedIdx, row, col)
  }, [selectedIdx, gameOver, placeBlock])

  // ── Touch drag support ───────────────────────────────────────────────
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
    // Offset touch 80px up so user can see placement under finger
    const pos = getCellFromPoint(touch.clientX, touch.clientY - 80, true)
    if (pos) {
      const adjRow = pos.row - Math.floor(bounds.rows / 2)
      const adjCol = pos.col - Math.floor(bounds.cols / 2)
      // Clamp so shape always stays within grid bounds
      const clamped = clampShapePos(adjRow, adjCol, shape)
      setHoverPos(clamped)
      hoverPosRef.current = clamped
    }
  }, [getCellFromPoint, clampShapePos])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || dragShapeIdx.current === null) return
    // Use ref to get latest hoverPos (avoids stale closure)
    const currentHoverPos = hoverPosRef.current
    if (currentHoverPos && dragShapeIdx.current !== null) {
      placeBlock(dragShapeIdx.current, currentHoverPos.row, currentHoverPos.col)
    }
    isDragging.current = false
    dragShapeIdx.current = null
    setHoverPos(null)
    hoverPosRef.current = null
  }, [placeBlock])

  // ── Mouse hover on grid ──────────────────────────────────────────────
  const handleGridMouseMove = useCallback((e: React.MouseEvent) => {
    if (selectedIdx === null || !shapes[selectedIdx]) return
    const pos = getCellFromPoint(e.clientX, e.clientY, true)
    if (pos) {
      const shape = shapes[selectedIdx]!
      const bounds = getShapeBounds(shape)
      const adjRow = pos.row - Math.floor(bounds.rows / 2)
      const adjCol = pos.col - Math.floor(bounds.cols / 2)
      const clamped = clampShapePos(adjRow, adjCol, shape)
      setHoverPos(clamped)
    }
  }, [selectedIdx, shapes, getCellFromPoint, clampShapePos])

  const handleGridMouseLeave = useCallback(() => {
    setHoverPos(null)
  }, [])

  const handleGridClick2 = useCallback((e: React.MouseEvent) => {
    if (selectedIdx === null || !shapes[selectedIdx] || gameOver) return
    const pos = getCellFromPoint(e.clientX, e.clientY, true)
    if (!pos) return
    const shape = shapes[selectedIdx]!
    const bounds = getShapeBounds(shape)
    const adjRow = pos.row - Math.floor(bounds.rows / 2)
    const adjCol = pos.col - Math.floor(bounds.cols / 2)
    const clamped = clampShapePos(adjRow, adjCol, shape)
    placeBlock(selectedIdx, clamped.row, clamped.col)
  }, [selectedIdx, shapes, gameOver, getCellFromPoint, clampShapePos, placeBlock])

  // ── Ghost cells (preview) ────────────────────────────────────────────
  const ghostCells = useMemo(() => {
    if (selectedIdx === null || !hoverPos || !shapes[selectedIdx]) return new Set<string>()
    const shape = shapes[selectedIdx]!
    const valid = canPlace(grid, shape, hoverPos.row, hoverPos.col)
    if (!valid) return new Set<string>()
    const s = new Set<string>()
    shape.cells.forEach(([r, c]) => s.add(`${hoverPos.row + r}-${hoverPos.col + c}`))
    return s
  }, [selectedIdx, hoverPos, shapes, grid])

  // Invalid placement preview
  const invalidGhost = useMemo(() => {
    if (selectedIdx === null || !hoverPos || !shapes[selectedIdx]) return false
    const shape = shapes[selectedIdx]!
    return !canPlace(grid, shape, hoverPos.row, hoverPos.col)
  }, [selectedIdx, hoverPos, shapes, grid])

  const ghostColor = selectedIdx !== null && shapes[selectedIdx] ? shapes[selectedIdx]!.color : '#a78bfa'

  // ── Role badge ───────────────────────────────────────────────────────
  const roleBadge = (role: string) => {
    const badges: Record<string, { label: string; class: string }> = {
      creator: { label: '👑', class: 'text-yellow-400' },
      admin: { label: '⚡', class: 'text-red-400' },
      moderator: { label: '🛡️', class: 'text-blue-400' },
      student: { label: '📚', class: 'text-gray-400' },
    }
    return badges[role] || badges.student
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div
      className={`overflow-hidden select-none ${shaking ? 'animate-shake' : ''}`}
      onTouchMove={handleTouchMove as unknown as React.TouchEventHandler<HTMLDivElement>}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 50%, 90% { transform: translateX(-3px) rotate(-0.5deg); }
          30%, 70% { transform: translateX(3px) rotate(0.5deg); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }

        @keyframes clearFlash {
          0% { opacity: 1; transform: scale(1); filter: brightness(1); }
          30% { opacity: 1; transform: scale(1.15); filter: brightness(2.5); background: white !important; }
          60% { opacity: 0.6; transform: scale(0.9); filter: brightness(1.5); }
          100% { opacity: 0; transform: scale(0.5); filter: brightness(0.5); }
        }
        .cell-clearing { animation: clearFlash 0.4s ease-out forwards; }

        @keyframes popUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          50% { opacity: 1; transform: translateY(-20px) scale(1.4); }
          100% { opacity: 0; transform: translateY(-50px) scale(0.8); }
        }
        .score-popup {
          animation: popUp 1s ease-out forwards;
          pointer-events: none;
          text-shadow: 0 0 10px rgba(255,215,0,0.8), 0 0 20px rgba(255,215,0,0.4);
        }

        @keyframes scaleIn {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.1) rotate(2deg); }
          80% { transform: scale(0.95) rotate(-1deg); }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        .shape-appear { animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        @keyframes dropBounce {
          0% { transform: scale(0.3); opacity: 0.5; }
          50% { transform: scale(1.08); }
          70% { transform: scale(0.96); }
          85% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
        .cell-placed { animation: dropBounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124,77,255,0.5), 0 0 8px rgba(124,77,255,0.2); }
          50% { box-shadow: 0 0 16px 6px rgba(124,77,255,0.3), 0 0 24px rgba(124,77,255,0.15); }
        }
        .selected-shape { animation: pulseGlow 1.5s ease-in-out infinite; }

        @keyframes particleFly {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--px), var(--py)) scale(0); }
        }
        .particle {
          animation: particleFly 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          pointer-events: none;
        }

        @keyframes scoreGlow {
          0%, 100% { text-shadow: 0 0 4px rgba(255,255,255,0.1); }
          50% { text-shadow: 0 0 16px rgba(255,255,255,0.3), 0 0 32px rgba(124,77,255,0.2); }
        }
        .score-glow { animation: scoreGlow 2s ease-in-out infinite; }

        @keyframes comboFlash {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); filter: brightness(1.5); }
          100% { transform: scale(1); }
        }
        .combo-flash { animation: comboFlash 0.3s ease-out; }

        @keyframes gameOverTitle {
          0% { opacity: 0; transform: scale(0.5) rotate(-5deg); }
          60% { transform: scale(1.1) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
        .game-over-title { animation: gameOverTitle 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        @keyframes ghostPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.55; }
        }
        .ghost-cell { animation: ghostPulse 1s ease-in-out infinite; }

        .grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 12.5% 12.5%;
        }
      `}</style>

      {/* Header */}
      <div className="text-center mb-4 mt-1">
        <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent drop-shadow-lg">
          Block Blast
        </h1>
        <div className="flex items-center justify-center gap-6 mt-2">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Score</p>
            <p className={`text-2xl font-bold text-white tabular-nums score-glow ${comboFlash ? 'combo-flash' : ''}`}>
              {score}
            </p>
          </div>
          {combo > 0 && (
            <div className={`flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 rounded-full border border-purple-500/30 ${comboFlash ? 'combo-flash' : ''}`}>
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-sm font-black text-purple-300">x{Math.min(combo, 5)}</span>
            </div>
          )}
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

      {/* Leaderboard overlay */}
      {showLeaderboard && !gameOver && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowLeaderboard(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 w-full max-w-sm space-y-3 fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2"><Trophy className="w-5 h-5" /> Tabela lidera</h3>
              <button onClick={() => setShowLeaderboard(false)} className="text-zinc-500 hover:text-white text-sm">✕</button>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-center text-zinc-500 py-4">Nema rezultata</p>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {leaderboard.map((e, i) => (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${i === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-zinc-800/50'}`}>
                    <span className={`text-sm font-bold w-6 ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-orange-400' : 'text-zinc-500'}`}>#{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.name}</p>
                      <p className="text-[10px] text-zinc-500">{e.classInfo}</p>
                    </div>
                    <span className="text-sm font-bold text-zinc-300">{e.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="relative mx-auto flex-1 w-full" style={{ maxWidth: '360px' }}>
        <div
          ref={gridRef}
          className="grid gap-[2px] rounded-xl p-[2px] border border-zinc-600/50 w-full mx-auto grid-bg"
          style={{
            gridTemplateColumns: `repeat(${GRID}, 1fr)`,
            aspectRatio: '1/1',
            maxWidth: '340px',
            maxHeight: '340px',
            background: 'linear-gradient(135deg, rgba(39,39,42,0.8), rgba(24,24,27,0.95))',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.4)',
          }}
          onMouseMove={handleGridMouseMove}
          onMouseLeave={handleGridMouseLeave}
          onClick={handleGridClick2}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const key = `${r}-${c}`
              const isGhost = ghostCells.has(key)
              const isClearing = clearingCells.has(key)
              return (
                <div
                  key={key}
                  className={`
                    aspect-square rounded-[4px] transition-all duration-150
                    ${cell.filled ? (cell.justPlaced ? 'cell-placed' : '') : ''}
                    ${isClearing ? 'cell-clearing' : ''}
                    ${!cell.filled && !isGhost ? '' : ''}
                    ${isGhost ? 'ghost-cell ring-1 ring-white/40' : ''}
                    ${invalidGhost && !isGhost && hoverPos ? '' : ''}
                  `}
                  style={{
                    backgroundColor: cell.filled
                      ? cell.color
                      : isGhost
                        ? `${ghostColor}55`
                        : 'rgba(9,9,11,0.7)',
                    ...(cell.filled ? {
                      backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 30%, transparent 50%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.3) 100%)`,
                      boxShadow: `inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(0,0,0,0.4), inset 1px 0 1px rgba(255,255,255,0.15), inset -1px 0 1px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.3)`,
                      border: `1px solid ${darkenColor(cell.color, 40)}`,
                      borderRadius: '4px',
                    } : {
                      border: '1px solid rgba(63,63,70,0.3)',
                    }),
                  }}
                  onClick={(e) => { e.stopPropagation(); handleGridClick(r, c) }}
                />
              )
            })
          )}
        </div>

        {/* Score popups */}
        {popups.map(p => (
          <div
            key={p.id}
            className="score-popup absolute text-base font-black text-yellow-300 z-10"
            style={{ left: p.x, top: p.y }}
          >
            +{p.value}
          </div>
        ))}

        {/* Particles */}
        {particles.map(p => (
          <div
            key={p.id}
            className="particle absolute rounded-full z-10"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              '--px': `${Math.cos(p.angle * Math.PI / 180) * p.speed * 40}px`,
              '--py': `${Math.sin(p.angle * Math.PI / 180) * p.speed * 40}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Shapes tray */}
      <div className="mt-5 flex items-center justify-center gap-5">
        {shapes.map((shape, idx) => {
          if (!shape) return <div key={idx} className="w-24 h-24" />
          const bounds = getShapeBounds(shape)
          const isSelected = selectedIdx === idx
          const cellPx = 20
          return (
            <button
              key={idx}
              className={`
                relative p-3 rounded-xl transition-all duration-200
                ${isSelected
                  ? 'selected-shape bg-zinc-700/70 scale-110 border border-purple-500/40'
                  : 'bg-zinc-800/50 hover:bg-zinc-700/50 hover:scale-105 border border-zinc-700/30 hover:border-zinc-500/50'}
                ${newShapeAnim ? 'shape-appear' : ''}
                active:scale-95
              `}
              style={{ animationDelay: newShapeAnim ? `${idx * 100}ms` : undefined }}
              onClick={() => setSelectedIdx(isSelected ? null : idx)}
              onTouchStart={(e) => handleTouchStart(e, idx)}
            >
              <div
                className="grid gap-[2px]"
                style={{
                  gridTemplateColumns: `repeat(${bounds.cols}, ${cellPx}px)`,
                  gridTemplateRows: `repeat(${bounds.rows}, ${cellPx}px)`,
                }}
              >
                {Array.from({ length: bounds.rows * bounds.cols }, (_, i) => {
                  const r = Math.floor(i / bounds.cols)
                  const c = i % bounds.cols
                  const isFilled = shape.cells.some(([sr, sc]) => sr - bounds.minR === r && sc - bounds.minC === c)
                  return (
                    <div
                      key={i}
                      className="rounded-[3px]"
                      style={{
                        width: cellPx,
                        height: cellPx,
                        backgroundColor: isFilled ? shape.color : 'transparent',
                        ...(isFilled ? {
                          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 30%, transparent 50%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.3) 100%)',
                          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
                          border: `1px solid ${darkenColor(shape.color, 40)}`,
                          borderRadius: '4px',
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
          <div className="fade-in-up bg-zinc-900/95 border border-zinc-600 rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ boxShadow: '0 0 60px rgba(124,77,255,0.15), 0 20px 40px rgba(0,0,0,0.5)' }}>
            <div className="text-center mb-5">
              <h2 className="game-over-title text-3xl font-black text-white mb-2">
                Kraj igre!
              </h2>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span
                  className="text-4xl font-black bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300 bg-clip-text text-transparent"
                  style={{ textShadow: '0 0 20px rgba(255,215,0,0.3)' }}
                >
                  {score}
                </span>
              </div>
              {score >= highScore && score > 0 && (
                <p className="text-sm text-purple-400 mt-1 flex items-center justify-center gap-1 font-semibold">
                  <Star className="w-4 h-4 fill-purple-400" /> Novi rekord!
                </p>
              )}
            </div>

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Leaderboard
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {leaderboard.map((entry, i) => {
                    const badge = roleBadge(entry.role)
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm ${
                          i === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-zinc-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-5 text-right font-mono text-xs ${
                            i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-orange-400' : 'text-zinc-500'
                          }`}>
                            {i + 1}.
                          </span>
                          <span className={badge.class}>{badge.label}</span>
                          <span className="text-white truncate max-w-[120px]">{entry.name}</span>
                          <span className="text-zinc-600 text-xs">{entry.classInfo}</span>
                        </div>
                        <span className="text-purple-300 font-semibold tabular-nums">
                          {entry.score}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <button
              onClick={startNewGame}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 active:scale-95 transition-all rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg"
              style={{ boxShadow: '0 4px 15px rgba(124,77,255,0.4)' }}
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
