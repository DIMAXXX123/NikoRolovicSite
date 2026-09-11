'use client'

import { Trophy, RotateCcw, Crown, Star } from 'lucide-react'
import type { LeaderEntry } from './engine'

const ROLE_BADGES: Record<string, { label: string; cls: string }> = {
  creator: { label: '👑', cls: 'text-yellow-400' },
  admin: { label: '⚡', cls: 'text-red-400' },
  moderator: { label: '🛡️', cls: 'text-blue-400' },
  student: { label: '📚', cls: 'text-gray-400' },
}

function roleBadge(role: string) {
  return ROLE_BADGES[role] || ROLE_BADGES.student
}

/** "Your place" row, shown only when the player sits outside the visible top 3. */
function MyPlace({ leaderboard, myUserId }: { leaderboard: LeaderEntry[]; myUserId: string | null }) {
  if (!myUserId) return null
  const myIdx = leaderboard.findIndex((e) => e.userId === myUserId)
  if (myIdx < 3) return null
  return (
    <div className="mt-2 px-3 py-2 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-between">
      <span className="text-xs text-purple-300">Tvoje mjesto</span>
      <span className="text-sm font-bold text-purple-400">#{myIdx + 1} od {leaderboard.length}</span>
    </div>
  )
}

export function LeaderboardOverlay({
  leaderboard,
  leaderLoading,
  myUserId,
  onClose,
}: {
  leaderboard: LeaderEntry[]
  leaderLoading: boolean
  myUserId: string | null
  onClose: () => void
}) {
  return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 w-full max-w-sm space-y-3 fade-in-up max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2"><Trophy className="w-5 h-5" /> Tabela lidera</h3>
            <button onClick={onClose} className="text-zinc-500 hover:text-white text-sm">✕</button>
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
              <MyPlace leaderboard={leaderboard} myUserId={myUserId} />
            </>
          )}
        </div>
      </div>
  )
}

export function GameOverOverlay({
  score,
  highScore,
  leaderboard,
  myUserId,
  onRestart,
}: {
  score: number
  highScore: number
  leaderboard: LeaderEntry[]
  myUserId: string | null
  onRestart: () => void
}) {
  return (
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
              <MyPlace leaderboard={leaderboard} myUserId={myUserId} />
            </div>
          )}

          <button
            onClick={onRestart}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 active:scale-95 transition-all rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg"
            style={{ boxShadow: '0 4px 15px rgba(168,85,247,0.4)' }}
          >
            <RotateCcw className="w-5 h-5" />
            Igraj ponovo
          </button>
        </div>
      </div>
  )
}
