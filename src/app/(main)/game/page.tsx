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

// ── Constants ──────────────────────────────────────────────────────────
const GRID = 8
const COLORS = [
  '#a78bfa', '#818cf8', '#c084fc', '#f472b6', '#fb923c',
  '#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a3e635',
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

  const gridRef = useRef<HTMLDivElement>(null)
  const popupId = useRef(0)
  const isDragging = useRef(false)
  const dragShapeIdx = useRef<number | null>(null)

  // ── Init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setHighScore(getHighScore())
    startNewGame()
  }, [])

  const generateShapes = useCallback(() => {
    const s = [randomShape(), randomShape(), randomShape()]
    setShapes(s)
    setNewShapeAnim(true)
    setTimeout(() => setNewShapeAnim(false), 300)
    return s
  }, [])

  const startNewGame = useCallback(() => {
    setGrid(emptyGrid())
    setScore(0)
    setCombo(0)
    setGameOver(false)
    setShaking(false)
    setPopups([])
    setSelectedIdx(null)
    setHoverPos(null)
    setClearingCells(new Set())
    generateShapes()
  }, [generateShapes])

  // ── Add popup ────────────────────────────────────────────────────────
  const addPopup = useCallback((x: number, y: number, value: number) => {
    const id = ++popupId.current
    setPopups(prev => [...prev, { id, x, y, value, ts: Date.now() }])
    setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 1000)
  }, [])

  // ── Place block ──────────────────────────────────────────────────────
  const placeBlock = useCallback((shapeIdx: number, row: number, col: number) => {
    const shape = shapes[shapeIdx]
    if (!shape || !canPlace(grid, shape, row, col)) return false

    const newGrid = grid.map(r => r.map(c => ({ ...c, justPlaced: false })))

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
    let pts = shape.cells.length * 10
    let newCombo = combo

    if (linesCleared > 0) {
      newCombo += 1
      const multiplier = Math.min(newCombo, 5)
      pts += linesCleared * 50 * multiplier

      // Mark clearing cells
      const clearing = new Set<string>()
      clearRows.forEach(r => {
        for (let c = 0; c < GRID; c++) clearing.add(`${r}-${c}`)
      })
      clearCols.forEach(c => {
        for (let r = 0; r < GRID; r++) clearing.add(`${r}-${c}`)
      })
      setClearingCells(clearing)

      // After animation, actually clear
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
      }, 350)
    } else {
      newCombo = 0
    }

    setCombo(newCombo)
    setGrid(newGrid)
    setScore(prev => prev + pts)

    // Popup
    if (gridRef.current) {
      const cellSize = gridRef.current.offsetWidth / GRID
      addPopup(col * cellSize + cellSize / 2, row * cellSize, pts)
    }

    // Remove used shape
    const newShapes = [...shapes]
    newShapes[shapeIdx] = null
    setShapes(newShapes)

    // If all shapes used, generate new batch
    const remaining = newShapes.filter(Boolean) as Shape[]
    if (remaining.length === 0) {
      setTimeout(() => {
        const fresh = generateShapes()
        // Check game over with fresh shapes
        setTimeout(() => {
          setGrid(g => {
            const anyCanPlace = fresh.some(s => s && canPlaceAnywhere(g, s))
            if (!anyCanPlace) {
              triggerGameOver(score + pts)
            }
            return g
          })
        }, 50)
      }, linesCleared > 0 ? 400 : 100)
    } else {
      // Check if remaining shapes can be placed
      setTimeout(() => {
        setGrid(g => {
          const anyCanPlace = remaining.some(s => canPlaceAnywhere(g, s))
          if (!anyCanPlace) {
            triggerGameOver(score + pts)
          }
          return g
        })
      }, linesCleared > 0 ? 400 : 50)
    }

    setSelectedIdx(null)
    setHoverPos(null)
    return true
  }, [grid, shapes, combo, score, addPopup, generateShapes])

  // ── Game Over ────────────────────────────────────────────────────────
  const triggerGameOver = useCallback((finalScore: number) => {
    setGameOver(true)
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
    saveHighScore(finalScore)
    setHighScore(Math.max(getHighScore(), finalScore))
    loadLeaderboard(finalScore)
  }, [])

  // ── Leaderboard ──────────────────────────────────────────────────────
  const loadLeaderboard = useCallback(async (currentScore: number) => {
    try {
      const supabase = createClient()
      const { data: profiles } = await supabase
        .from('profiles')
        .select('first_name, last_name, class_number, section_number, role')
        .order('created_at', { ascending: true })
        .limit(10)

      if (profiles && profiles.length > 0) {
        const entries: LeaderEntry[] = profiles.map((p: any, i: number) => ({
          rank: i + 1,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          classInfo: `${p.class_number || '?'}-${p.section_number || '?'}`,
          role: p.role || 'student',
          score: 0,
        }))
        setLeaderboard(entries)
      }
    } catch {
      // Fallback to local scores
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
  const getCellFromPoint = useCallback((clientX: number, clientY: number): { row: number; col: number } | null => {
    if (!gridRef.current) return null
    const rect = gridRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const cellSize = rect.width / GRID
    const col = Math.floor(x / cellSize)
    const row = Math.floor(y / cellSize)
    if (row < 0 || row >= GRID || col < 0 || col >= GRID) return null
    return { row, col }
  }, [])

  // ── Touch / Mouse handlers for grid ──────────────────────────────────
  const handleGridClick = useCallback((row: number, col: number) => {
    if (selectedIdx === null || gameOver) return
    placeBlock(selectedIdx, row, col)
  }, [selectedIdx, gameOver, placeBlock])

  // ── Touch drag support ───────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent, idx: number) => {
    if (gameOver || !shapes[idx]) return
    isDragging.current = true
    dragShapeIdx.current = idx
    setSelectedIdx(idx)
  }, [gameOver, shapes])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || dragShapeIdx.current === null) return
    e.preventDefault()
    const touch = e.touches[0]
    const shape = shapes[dragShapeIdx.current]
    if (!shape) return
    const bounds = getShapeBounds(shape)
    const pos = getCellFromPoint(touch.clientX, touch.clientY - 40)
    if (pos) {
      // Center the shape on the touch point
      const adjRow = pos.row - Math.floor(bounds.rows / 2)
      const adjCol = pos.col - Math.floor(bounds.cols / 2)
      setHoverPos({ row: adjRow, col: adjCol })
    } else {
      setHoverPos(null)
    }
  }, [shapes, getCellFromPoint])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || dragShapeIdx.current === null) return
    if (hoverPos && dragShapeIdx.current !== null) {
      placeBlock(dragShapeIdx.current, hoverPos.row, hoverPos.col)
    }
    isDragging.current = false
    dragShapeIdx.current = null
    setHoverPos(null)
  }, [hoverPos, placeBlock])

  // ── Mouse hover on grid ──────────────────────────────────────────────
  const handleGridMouseMove = useCallback((e: React.MouseEvent) => {
    if (selectedIdx === null || !shapes[selectedIdx]) return
    const pos = getCellFromPoint(e.clientX, e.clientY)
    if (pos) {
      const shape = shapes[selectedIdx]!
      const bounds = getShapeBounds(shape)
      setHoverPos({ row: pos.row - Math.floor(bounds.rows / 2), col: pos.col - Math.floor(bounds.cols / 2) })
    }
  }, [selectedIdx, shapes, getCellFromPoint])

  const handleGridMouseLeave = useCallback(() => {
    setHoverPos(null)
  }, [])

  const handleGridClick2 = useCallback((e: React.MouseEvent) => {
    if (selectedIdx === null || !shapes[selectedIdx] || gameOver) return
    const pos = getCellFromPoint(e.clientX, e.clientY)
    if (!pos) return
    const shape = shapes[selectedIdx]!
    const bounds = getShapeBounds(shape)
    const adjRow = pos.row - Math.floor(bounds.rows / 2)
    const adjCol = pos.col - Math.floor(bounds.cols / 2)
    placeBlock(selectedIdx, adjRow, adjCol)
  }, [selectedIdx, shapes, gameOver, getCellFromPoint, placeBlock])

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
      className={`fixed inset-0 top-14 bottom-20 overflow-hidden select-none flex flex-col ${shaking ? 'animate-shake' : ''}`}
      onTouchMove={handleTouchMove as any}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        @keyframes clearFlash {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); background: white; }
          100% { opacity: 0; transform: scale(0.8); }
        }
        .cell-clearing { animation: clearFlash 0.35s ease-out forwards; }
        @keyframes popUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-40px) scale(1.3); }
        }
        .score-popup { animation: popUp 0.8s ease-out forwards; pointer-events: none; }
        @keyframes scaleIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        .shape-appear { animation: scaleIn 0.3s ease-out forwards; }
        @keyframes snapIn {
          0% { transform: scale(0.8); opacity: 0.5; }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .cell-placed { animation: snapIn 0.2s ease-out; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(167,139,250,0.4); }
          50% { box-shadow: 0 0 12px 4px rgba(167,139,250,0.2); }
        }
        .selected-shape { animation: pulse-glow 1.5s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="text-center mb-4 mt-1">
        <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
          Block Blast
        </h1>
        <div className="flex items-center justify-center gap-6 mt-2">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Score</p>
            <p className="text-2xl font-bold text-white tabular-nums">{score}</p>
          </div>
          {combo > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded-full">
              <Zap className="w-3 h-3 text-purple-400" />
              <span className="text-xs font-bold text-purple-300">x{Math.min(combo, 5)}</span>
            </div>
          )}
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Best</p>
            <p className="text-lg font-semibold text-zinc-400 tabular-nums">{highScore}</p>
          </div>
          <button
            onClick={() => { setShowLeaderboard(!showLeaderboard); if (!showLeaderboard) loadLeaderboard(score) }}
            className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 active:scale-90 transition-all"
            title="Tabela lidera"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Leaderboard overlay */}
      {showLeaderboard && !gameOver && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowLeaderboard(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 w-full max-w-sm space-y-3 animate-scale-in" onClick={e => e.stopPropagation()}>
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
      <div className="relative mx-auto" style={{ maxWidth: 'min(100%, 360px)' }}>
        <div
          ref={gridRef}
          className="grid gap-[1px] bg-zinc-800/50 rounded-xl p-[1px] border border-zinc-700/50"
          style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)`, aspectRatio: '1/1' }}
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
                    aspect-square rounded-[3px] transition-all duration-150
                    ${cell.filled ? (cell.justPlaced ? 'cell-placed' : '') : ''}
                    ${isClearing ? 'cell-clearing' : ''}
                    ${!cell.filled && !isGhost ? 'bg-zinc-900/80' : ''}
                    ${isGhost ? 'ring-1 ring-white/30' : ''}
                  `}
                  style={{
                    backgroundColor: cell.filled
                      ? cell.color
                      : isGhost
                        ? `${ghostColor}55`
                        : undefined,
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
            className="score-popup absolute text-sm font-bold text-yellow-300 z-10"
            style={{ left: p.x, top: p.y }}
          >
            +{p.value}
          </div>
        ))}
      </div>

      {/* Shapes tray */}
      <div className="mt-5 flex items-center justify-center gap-4">
        {shapes.map((shape, idx) => {
          if (!shape) return <div key={idx} className="w-20 h-20" />
          const bounds = getShapeBounds(shape)
          const isSelected = selectedIdx === idx
          return (
            <button
              key={idx}
              className={`
                relative p-2 rounded-xl transition-all duration-200
                ${isSelected ? 'selected-shape bg-zinc-700/60 scale-110' : 'bg-zinc-800/40 hover:bg-zinc-700/40'}
                ${newShapeAnim ? 'shape-appear' : ''}
              `}
              style={{ animationDelay: newShapeAnim ? `${idx * 80}ms` : undefined }}
              onClick={() => setSelectedIdx(isSelected ? null : idx)}
              onTouchStart={(e) => handleTouchStart(e, idx)}
            >
              <div
                className="grid gap-[2px]"
                style={{
                  gridTemplateColumns: `repeat(${bounds.cols}, 16px)`,
                  gridTemplateRows: `repeat(${bounds.rows}, 16px)`,
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
                        width: 16,
                        height: 16,
                        backgroundColor: isFilled ? shape.color : 'transparent',
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="fade-in-up bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white mb-1">Kraj igre!</h2>
              <div className="flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-3xl font-black bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                  {score}
                </span>
              </div>
              {score >= highScore && score > 0 && (
                <p className="text-xs text-purple-400 mt-1 flex items-center justify-center gap-1">
                  <Star className="w-3 h-3" /> Novi rekord!
                </p>
              )}
            </div>

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Leaderboard
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {leaderboard.map((entry, i) => {
                    const badge = roleBadge(entry.role)
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/60 rounded-lg text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 w-5 text-right font-mono text-xs">
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
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 active:scale-95 transition-all rounded-xl text-white font-semibold flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Igraj ponovo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
