// Block Blast game engine: shapes, grid maths, scoring and the localStorage
// leaderboard. Kept out of the page component so the view stays readable.
// ── Types ──────────────────────────────────────────────────────────────
export type Cell = { filled: boolean; color: string; clearing?: boolean; justPlaced?: boolean }
export type Shape = { cells: [number, number][]; color: string; name: string }
export type Grid = Cell[][]
export type LeaderEntry = { rank: number; name: string; classInfo: string; role: string; score: number; userId?: string }

// ── Constants ──────────────────────────────────────────────────────────
export const GRID = 8

export const COLORS = [
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
export const SHAPE_DEFS: { cells: [number, number][]; name: string; weight: number }[] = [
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
export function randomShape(): Shape {
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

export function emptyGrid(): Grid {
  return Array.from({ length: GRID }, () =>
    Array.from({ length: GRID }, () => ({ filled: false, color: '' }))
  )
}

export function canPlace(grid: Grid, shape: Shape, row: number, col: number): boolean {
  return shape.cells.every(([r, c]) => {
    const nr = row + r, nc = col + c
    return nr >= 0 && nr < GRID && nc >= 0 && nc < GRID && !grid[nr][nc].filled
  })
}

export function canPlaceAnywhere(grid: Grid, shape: Shape): boolean {
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++)
      if (canPlace(grid, shape, r, c)) return true
  return false
}

export function findNearestValidPosition(
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

export function getShapeBounds(shape: Shape) {
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity
  for (const [r, c] of shape.cells) {
    minR = Math.min(minR, r); maxR = Math.max(maxR, r)
    minC = Math.min(minC, c); maxC = Math.max(maxC, c)
  }
  return { rows: maxR - minR + 1, cols: maxC - minC + 1, minR, minC }
}

export function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16)
  const r = Math.max(0, (num >> 16) - amount)
  const g = Math.max(0, ((num >> 8) & 0x00FF) - amount)
  const b = Math.max(0, (num & 0x0000FF) - amount)
  return `rgb(${r},${g},${b})`
}

export function isBoardEmpty(grid: Grid): boolean {
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++)
      if (grid[r][c].filled) return false
  return true
}

// ── LocalStorage helpers ───────────────────────────────────────────────
const LS_KEY = 'blockblast_highscore'
const LS_SCORES_KEY = 'blockblast_scores'

export function getHighScore(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(LS_KEY) || '0', 10)
}

export function saveHighScore(score: number) {
  const prev = getHighScore()
  if (score > prev) localStorage.setItem(LS_KEY, String(score))
}

export const SEED_SCORES: LeaderEntry[] = [
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

export function resetAndSeedScores() {
  if (typeof window === 'undefined') return
  if (!localStorage.getItem(LS_RESET_KEY)) {
    localStorage.removeItem(LS_KEY)
    localStorage.setItem(LS_SCORES_KEY, JSON.stringify(SEED_SCORES))
    localStorage.setItem(LS_RESET_KEY, '1')
  }
}

export function getLocalScores(): LeaderEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LS_SCORES_KEY) || '[]')
  } catch { return [] }
}

export function saveLocalScore(entry: LeaderEntry) {
  const scores = getLocalScores()
  scores.push(entry)
  scores.sort((a, b) => b.score - a.score)
  localStorage.setItem(LS_SCORES_KEY, JSON.stringify(scores.slice(0, 20)))
}

// ── Scoring ────────────────────────────────────────────────────────────
export function calcLineScore(linesCleared: number): number {
  if (linesCleared === 0) return 0
  if (linesCleared === 1) return 10
  if (linesCleared === 2) return 30
  if (linesCleared === 3) return 60
  if (linesCleared === 4) return 100
  return 150 // 5+ lines
}

