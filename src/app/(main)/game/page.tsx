'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { Trophy, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GameOverOverlay, LeaderboardOverlay } from './game-overlays'
import {
  GRID,
  canPlace,
  canPlaceAnywhere,
  darkenColor,
  emptyGrid,
  findNearestValidPosition,
  getHighScore,
  getLocalScores,
  getShapeBounds,
  isBoardEmpty,
  randomShape,
  resetAndSeedScores,
  saveHighScore,
  saveLocalScore,
  type Grid,
  type LeaderEntry,
  type Shape,
} from './engine'

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
    // Crazy scoring: base 25 per cell, combo multiplier uncapped, line bonus huge
    const baseMultiplier = Math.max(1, newCombo * 2)
    let pts = shape.cells.length * 25 * Math.max(1, Math.floor(baseMultiplier / 2))

    if (linesCleared > 0) {
      newCombo += linesCleared // combo grows by lines cleared, not just +1
      const multiplier = 5 + newCombo * 8 // starts at 13, grows fast
      pts += linesCleared * 120 * multiplier
      // Bonus for multi-line clears
      if (linesCleared >= 2) pts += linesCleared * 500 * Math.floor(multiplier / 2)
      if (linesCleared >= 3) pts += 3000 * newCombo
      if (linesCleared >= 4) pts += 10000 * newCombo

      // Show combo text
      if (newCombo >= 1) {
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

      // Clear cells after animation
      setTimeout(() => {
        setGrid(prev => {
          const g = prev.map(r => r.map(c => ({ ...c })))
          clearRows.forEach(r => { for (let c = 0; c < GRID; c++) g[r][c] = { filled: false, color: '' } })
          clearCols.forEach(c => { for (let r = 0; r < GRID; r++) g[r][c] = { filled: false, color: '' } })

          // Board clear bonus
          if (isBoardEmpty(g)) {
            pts += 360
            setScore(prev2 => {
              const ns = prev2 + 360
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
    }
    // Combo never resets — only grows when lines are cleared

    setCombo(newCombo)
    comboRef.current = newCombo
    setGrid(newGrid)
    gridStateRef.current = newGrid
    setScore(prev => {
      const newScore = prev + pts
      scoreRef.current = newScore
      return newScore
    })

    // Remove used shape
    const newShapes = [...shapesRef.current]
    newShapes[shapeIdx] = null
    setShapes(newShapes)
    shapesRef.current = newShapes

    // If all 3 placed, generate new batch — combo persists!
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

  const ghostColor = selectedIdx !== null && shapes[selectedIdx] ? shapes[selectedIdx]!.color : '#1CB0F6'

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
          40% { opacity: 1; transform: scale(1.05); background-color: #FFC800 !important; }
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
        <div className="flex items-center justify-center gap-5">
          <div className="text-center">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Score</p>
            <p className={`text-[36px] leading-none font-black text-heading tabular-nums ${comboFlash ? 'combo-flash' : ''}`}>
              {score}
            </p>
          </div>
          <div
            className={`flex h-10 items-center gap-1 px-3 rounded-xl border-2 ${
              combo >= 1
                ? 'bg-secondary-light border-secondary-light-border text-secondary shadow-[0_2px_0_var(--color-secondary-light-border)]'
                : 'bg-background border-border text-muted-foreground shadow-[0_2px_0_var(--color-border)]'
            } ${comboFlash ? 'combo-flash' : ''}`}
          >
            <Zap className="w-4 h-4" strokeWidth={2.6} />
            <span className="text-[15px] font-black tabular-nums">
              x{combo >= 1 ? combo : 1}
            </span>
          </div>
          <div className="text-center">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Best</p>
            <p className="text-[20px] leading-none font-black text-muted-foreground tabular-nums mt-1">{highScore}</p>
          </div>
          <Button
            variant="gold"
            size="icon"
            onClick={() => { setShowLeaderboard(!showLeaderboard); if (!showLeaderboard) loadLeaderboard(score) }}
            title="Tabela lidera"
          >
            <Trophy strokeWidth={2.6} />
          </Button>
        </div>
      </div>

      {/* Combo popup above score */}
      {comboText && (
        <div key={comboText.id} className="combo-popup text-center text-[20px] font-black text-primary-text">
          x{comboText.value} COMBO!
        </div>
      )}

      {/* Leaderboard overlay */}
      {showLeaderboard && !gameOver && (
        <LeaderboardOverlay
          leaderboard={leaderboard}
          leaderLoading={leaderLoading}
          myUserId={myUserId}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* Grid */}
      <div className="relative mx-auto w-full" style={{ maxWidth: '360px' }}>
        <div className="rounded-2xl border-2 border-border bg-card p-2 shadow-[0_2px_0_var(--color-border)]">
          <div
            ref={gridRef}
            className="grid w-full mx-auto"
            style={{
              gridTemplateColumns: `repeat(${GRID}, 1fr)`,
              gap: '2px',
              aspectRatio: '1/1',
              maxWidth: '340px',
              maxHeight: '340px',
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
                      aspect-square rounded-[4px] box-border
                      ${cell.filled && cell.justPlaced ? 'cell-placed' : ''}
                      ${isClearing ? 'cell-clearing' : ''}
                      ${isGhost ? 'ghost-cell' : ''}
                    `}
                    style={{
                      backgroundColor: cell.filled
                        ? cell.color
                        : isGhost
                          ? `${ghostColor}44`
                          : '#F7F7F7',
                      ...(cell.filled ? {
                        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.08) 35%, transparent 55%)',
                        boxShadow: `inset 0 1px 0 ${darkenColor(cell.color, -40)}, inset 0 -1px 0 ${darkenColor(cell.color, 60)}, inset 1px 0 0 ${darkenColor(cell.color, -25)}, inset -1px 0 0 ${darkenColor(cell.color, 45)}`,
                        border: `2px solid ${darkenColor(cell.color, 50)}`,
                      } : {
                        border: '2px solid #E5E5E5',
                      }),
                      ...(isGhost ? {
                        border: `2px solid ${ghostColor}`,
                      } : {}),
                    }}
                  />
                )
              })
            )}
          </div>
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
                relative p-3 rounded-2xl border-2 transition-all duration-200 min-w-[88px] min-h-[88px]
                flex items-center justify-center
                ${isSelected
                  ? 'bg-secondary-light border-secondary-light-border shadow-[0_2px_0_var(--color-secondary-light-border)] scale-105'
                  : 'bg-background border-border shadow-[0_2px_0_var(--color-border)] hover:bg-muted'}
                ${newShapeAnim ? 'shape-appear' : ''}
                active:translate-y-[2px] active:shadow-none
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
                      className="rounded-[3px] box-border"
                      style={{
                        width: cellPx,
                        height: cellPx,
                        backgroundColor: isFilled ? shape.color : 'transparent',
                        ...(isFilled ? {
                          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.08) 35%, transparent 55%)',
                          boxShadow: `inset 0 1px 0 ${darkenColor(shape.color, -40)}, inset 0 -1px 0 ${darkenColor(shape.color, 60)}, inset 1px 0 0 ${darkenColor(shape.color, -25)}, inset -1px 0 0 ${darkenColor(shape.color, 45)}`,
                          border: `1px solid ${darkenColor(shape.color, 50)}`,
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
        <p className="text-center text-[13px] font-bold text-muted-foreground mt-3">
          Tap on grid to place • Tap shape again to deselect
        </p>
      )}

      {/* Game Over Overlay */}
      {gameOver && (
        <GameOverOverlay
          score={score}
          highScore={highScore}
          leaderboard={leaderboard}
          myUserId={myUserId}
          onRestart={startNewGame}
        />
      )}
    </div>
  )
}
