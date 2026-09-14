'use client'

import { Trophy, RotateCcw, Crown, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LeaderEntry } from './engine'

const ROLE_BADGES: Record<string, { label: string; cls: string }> = {
  creator: { label: '👑', cls: 'text-accent' },
  admin: { label: '⚡', cls: 'text-destructive' },
  moderator: { label: '🛡️', cls: 'text-orange' },
  student: { label: '📚', cls: 'text-muted-foreground' },
}

function roleBadge(role: string) {
  return ROLE_BADGES[role] || ROLE_BADGES.student
}

/** Rank circle (§7 /game): 1 = gold, 2 = #CECECE, 3 = #FF9600, rest = grey outline. */
function rankCircleClass(i: number, isMe: boolean) {
  if (i === 0) return 'bg-gold border-gold text-[#4B4B4B]'
  if (i === 1) return 'bg-border-strong border-border-strong text-[#4B4B4B]'
  if (i === 2) return 'bg-orange border-orange text-white'
  if (isMe) return 'bg-primary-light border-primary-light-border text-primary-text'
  return 'bg-muted border-border text-muted-foreground'
}

/** §4.10 row classes; "me" row gets the highlighted (green) card look. */
function rowClass(i: number, isMe: boolean) {
  if (isMe) return 'border-primary-light-border bg-[#F4FFEA] shadow-[0_2px_0_var(--color-primary-light-border)]'
  if (i === 0) return 'border-[#FFE28A] bg-[#FFF9E0] shadow-[0_2px_0_#FFE28A]'
  return 'border-border bg-background shadow-[0_2px_0_var(--color-border)]'
}

/** "Your place" row, shown only when the player sits outside the visible top 3. */
function MyPlace({ leaderboard, myUserId }: { leaderboard: LeaderEntry[]; myUserId: string | null }) {
  if (!myUserId) return null
  const myIdx = leaderboard.findIndex((e) => e.userId === myUserId)
  if (myIdx < 3) return null
  return (
    <div className="mt-3 px-4 py-3 rounded-2xl bg-primary-light border-2 border-primary-light-border flex items-center justify-between">
      <span className="text-[13px] font-bold text-primary-text">Tvoje mjesto</span>
      <span className="text-[15px] font-extrabold text-primary-text tabular-nums">#{myIdx + 1} od {leaderboard.length}</span>
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
      <div className="fixed inset-0 z-[100] bg-[rgba(0,0,0,0.4)] flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-card border-2 border-border rounded-3xl p-6 w-full max-w-sm space-y-3 fade-in-up max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <h3 className="text-[20px] leading-[1.25] font-extrabold text-heading flex items-center gap-2"><Trophy className="w-5 h-5 text-gold" strokeWidth={2.6} /> Tabela lidera</h3>
            <button
              onClick={onClose}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl text-[18px] font-extrabold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >✕</button>
          </div>
          {leaderLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-border" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-secondary animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                <span className="absolute inset-0 flex items-center justify-center text-lg">🏆</span>
              </div>
              <p className="text-[13px] font-bold text-muted-foreground animate-pulse">Učitavanje tabele...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="text-center text-[15px] font-bold text-muted-foreground py-4">Nema rezultata</p>
          ) : (
            <>
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pb-1">
                {leaderboard.map((e, i) => {
                  const isMe = !!(myUserId && e.userId === myUserId)
                  return (
                    <div key={i} className={`flex items-center gap-3 min-h-[64px] px-4 py-3 rounded-2xl border-2 transition-all ${rowClass(i, isMe)}`}>
                      <span className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 text-[15px] font-black tabular-nums ${rankCircleClass(i, isMe)}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[17px] leading-[1.3] font-extrabold truncate ${isMe ? 'text-primary-text' : 'text-heading'}`}>{e.name} {isMe ? '← ti' : ''}</p>
                        <p className="text-[13px] font-bold text-muted-foreground">{e.classInfo}</p>
                      </div>
                      <span className={`text-[17px] font-black tabular-nums ${isMe ? 'text-primary-text' : 'text-foreground'}`}>{e.score.toLocaleString()}</span>
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(0,0,0,0.4)] p-4">
        <div className="fade-in-up bg-card border-2 border-border rounded-3xl p-6 w-full max-w-sm">
          <div className="text-center mb-5">
            <h2 className="game-over-title text-[26px] leading-[1.2] tracking-[-0.01em] font-extrabold text-heading mb-2">
              Kraj igre!
            </h2>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-7 h-7 text-gold" strokeWidth={2.6} />
              <span className="text-[36px] leading-none font-black text-heading tabular-nums">
                {score}
              </span>
            </div>
            {score >= highScore && score > 0 && (
              <p className="text-[13px] text-primary-text mt-2 flex items-center justify-center gap-1 font-extrabold">
                <Star className="w-4 h-4 text-gold fill-gold" strokeWidth={2.6} /> Novi rekord!
              </p>
            )}
          </div>

          {leaderboard.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground mb-2 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" strokeWidth={2.6} /> Leaderboard
              </h3>
              <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pb-1">
                {leaderboard.map((entry, i) => {
                  const badge = roleBadge(entry.role)
                  const isMe = !!(myUserId && entry.userId === myUserId)
                  return (
                    <div key={i} className={`flex items-center gap-3 min-h-[64px] px-4 py-3 rounded-2xl border-2 ${rowClass(i, isMe)}`}>
                      <span className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 text-[15px] font-black tabular-nums ${rankCircleClass(i, isMe)}`}>
                        {i + 1}
                      </span>
                      <div className="flex flex-1 min-w-0 items-center gap-2">
                        <span className={`shrink-0 ${badge.cls}`}>{badge.label}</span>
                        <div className="min-w-0">
                          <p className={`text-[17px] leading-[1.3] font-extrabold truncate ${isMe ? 'text-primary-text' : 'text-heading'}`}>{entry.name}{isMe ? ' ←' : ''}</p>
                          <p className="text-[13px] font-bold text-muted-foreground">{entry.classInfo}</p>
                        </div>
                      </div>
                      <span className={`text-[17px] font-black tabular-nums ${isMe ? 'text-primary-text' : 'text-foreground'}`}>{entry.score.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
              <MyPlace leaderboard={leaderboard} myUserId={myUserId} />
            </div>
          )}

          <Button onClick={onRestart} className="w-full">
            <RotateCcw strokeWidth={2.6} />
            Igraj ponovo
          </Button>
        </div>
      </div>
  )
}
