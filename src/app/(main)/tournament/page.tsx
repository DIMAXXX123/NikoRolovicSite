'use client'

import { useState, useEffect } from 'react'
import { Trophy, Heart, ChevronRight, Star, Flame, Timer, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────────────────
type Match = {
  id: string
  round: '1/8' | '1/4' | '1/2' | 'finale'
  teamA: string
  teamB: string
  scoreA?: number
  scoreB?: number
  date: string
  time: string
  played: boolean
  technical?: boolean
}

type Team = {
  name: string
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
}

// ── Data ───────────────────────────────────────────────────────────────
const MATCHES: Match[] = [
  // 1/8 Finals
  { id: 'm1', round: '1/8', teamA: 'IV6', teamB: 'II1', scoreA: 48, scoreB: 32, date: '18.3', time: '12:45', played: true },
  { id: 'm2', round: '1/8', teamA: 'III5', teamB: 'II5', scoreA: 45, scoreB: 25, date: '18.3', time: '12:45', played: true },
  { id: 'm3', round: '1/8', teamA: 'II3', teamB: 'II6', scoreA: 70, scoreB: 23, date: '18.3', time: '12:45', played: true },
  { id: 'm4', round: '1/8', teamA: 'III4', teamB: 'III3', scoreA: 16, scoreB: 28, date: '18.3', time: '12:45', played: true },
  { id: 'm5', round: '1/8', teamA: 'II4', teamB: 'I5', scoreA: 36, scoreB: 30, date: '18.3', time: '12:45', played: true },
  { id: 'm6', round: '1/8', teamA: 'IV3', teamB: 'I6', scoreA: 20, scoreB: 0, date: '18.3', time: '12:45', played: true, technical: true },
  { id: 'm7', round: '1/8', teamA: 'III2', teamB: 'IV1', scoreA: 20, scoreB: 0, date: '18.3', time: '12:45', played: true, technical: true },
  // Quarter Finals
  { id: 'q1', round: '1/4', teamA: 'IV6', teamB: 'I3', scoreA: 62, scoreB: 46, date: '19.3', time: '12:45', played: true },
  { id: 'q2', round: '1/4', teamA: 'III5', teamB: 'II4', date: '27.3', time: '12:45', played: false },
  { id: 'q3', round: '1/4', teamA: 'IV3', teamB: 'II3', date: '23.3', time: '12:45', played: false },
  { id: 'q4', round: '1/4', teamA: 'III2', teamB: 'III3', date: '26.3', time: '12:45', played: false },
  // Semi Finals
  { id: 's1', round: '1/2', teamA: 'IV6', teamB: '?', date: 'TBD', time: '12:45', played: false },
  { id: 's2', round: '1/2', teamA: '?', teamB: '?', date: 'TBD', time: '12:45', played: false },
]

const QUALIFIED = ['IV6', 'III5', 'II3', 'III3', 'II4', 'IV3', 'I3', 'III2']

const CLASS_COLORS: Record<string, string> = {
  'I': 'from-emerald-500 to-emerald-700',
  'II': 'from-blue-500 to-blue-700',
  'III': 'from-purple-500 to-purple-700',
  'IV': 'from-amber-500 to-amber-700',
}

function getClassColor(team: string) {
  const roman = team.match(/^(I{1,3}V?|IV)/)?.[0] || ''
  return CLASS_COLORS[roman] || 'from-zinc-500 to-zinc-700'
}

// ── Component ──────────────────────────────────────────────────────────
export default function TournamentPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'bracket' | 'grid' | 'results' | 'teams'>('bracket')
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    // Load favorites from localStorage
    const saved = localStorage.getItem('tournament_favorites')
    if (saved) setFavorites(new Set(JSON.parse(saved)))
    setAnimateIn(true)
  }, [])

  function toggleFavorite(team: string) {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(team)) next.delete(team)
      else next.add(team)
      localStorage.setItem('tournament_favorites', JSON.stringify([...next]))
      return next
    })
  }

  // Build team stats
  const teamStats = new Map<string, Team>()
  MATCHES.filter(m => m.played && m.scoreA !== undefined).forEach(m => {
    if (!teamStats.has(m.teamA)) teamStats.set(m.teamA, { name: m.teamA, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 })
    if (!teamStats.has(m.teamB)) teamStats.set(m.teamB, { name: m.teamB, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 })
    const a = teamStats.get(m.teamA)!
    const b = teamStats.get(m.teamB)!
    a.pointsFor += m.scoreA!; a.pointsAgainst += m.scoreB!
    b.pointsFor += m.scoreB!; b.pointsAgainst += m.scoreA!
    if (m.scoreA! > m.scoreB!) { a.wins++; b.losses++ }
    else { b.wins++; a.losses++ }
  })

  const upcomingMatches = MATCHES.filter(m => !m.played)
  const playedMatches = MATCHES.filter(m => m.played)

  const tabs = [
    { id: 'bracket' as const, label: 'Turnir', icon: '🏆' },
    { id: 'grid' as const, label: 'Setka', icon: '📋' },
    { id: 'results' as const, label: 'Rezultati', icon: '📊' },
    { id: 'teams' as const, label: 'Timovi', icon: '👥' },
  ]

  return (
    <div className={`space-y-4 pb-8 transition-all duration-500 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 p-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center active:scale-90 transition-transform">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <span className="text-3xl">🏀</span>
            <div>
              <h1 className="text-xl font-black text-white">Turnir u košarci</h1>
              <p className="text-xs text-white/70">Gimnazija Niko Rolović — Mart 2026</p>
            </div>
          </div>
          <div className="flex gap-3 mt-3">
            <div className="bg-black/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-xs font-bold text-white">{playedMatches.length} odigrano</span>
            </div>
            <div className="bg-black/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-white/80" />
              <span className="text-xs font-bold text-white">{upcomingMatches.length} preostalo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/60'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ══════ BRACKET TAB ══════ */}
      {activeTab === 'bracket' && (
        <div className="space-y-4 animate-fade-in">
          {/* Upcoming */}
          {upcomingMatches.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Timer className="w-4 h-4 text-orange-400" /> Sljedeći mečevi
              </h2>
              <div className="space-y-2">
                {upcomingMatches.map((m, i) => (
                  <div
                    key={m.id}
                    className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 transition-all hover:border-orange-500/30"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-orange-400 uppercase">{m.round} finala</span>
                      <span className="text-[10px] text-zinc-500">{m.date} • {m.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <TeamBadge name={m.teamA} isFav={favorites.has(m.teamA)} onFav={() => toggleFavorite(m.teamA)} />
                      <span className="text-xs font-bold text-zinc-600">VS</span>
                      <TeamBadge name={m.teamB} isFav={favorites.has(m.teamB)} onFav={() => toggleFavorite(m.teamB)} right />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Qualified teams */}
          <div>
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" /> U četvrtfinalu
            </h2>
            <div className="flex flex-wrap gap-2">
              {QUALIFIED.map(team => (
                <button
                  key={team}
                  onClick={() => toggleFavorite(team)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                    favorites.has(team)
                      ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-300'
                  }`}
                >
                  {favorites.has(team) ? '❤️ ' : ''}{team}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════ GRID/SETKA TAB ══════ */}
      {activeTab === 'grid' && (
        <div className="animate-fade-in overflow-x-auto -mx-4 px-4 pb-4">
          {/* Column headers */}
          <div className="min-w-[620px] flex gap-4 mb-3 px-1">
            <div className="w-[135px] shrink-0 text-center text-[10px] font-bold text-zinc-500 uppercase">1/8 Finala</div>
            <div className="w-[135px] shrink-0 text-center text-[10px] font-bold text-zinc-500 uppercase">Četvrtfinale</div>
            <div className="w-[135px] shrink-0 text-center text-[10px] font-bold text-zinc-500 uppercase">Polufinale</div>
            <div className="w-[135px] shrink-0 text-center text-[10px] font-bold text-amber-400 uppercase">🏆 Finale</div>
          </div>
          <div className="min-w-[620px] flex gap-4 items-stretch px-1">
            {/* Round 1 - 1/8 Finals (8 matches) */}
            <div className="flex flex-col gap-2 w-[135px] shrink-0">
              <BracketMatch teamA="IV6" teamB="II1" scoreA={48} scoreB={32} />
              <BracketMatch teamA="I3" teamB="—" isBye />
              <BracketMatch teamA="IV3" teamB="I6" scoreA={20} scoreB={0} tech />
              <BracketMatch teamA="II3" teamB="II6" scoreA={70} scoreB={23} />
              <BracketMatch teamA="II4" teamB="I5" scoreA={36} scoreB={30} />
              <BracketMatch teamA="III5" teamB="II5" scoreA={45} scoreB={25} />
              <BracketMatch teamA="III3" teamB="III4" scoreA={28} scoreB={16} />
              <BracketMatch teamA="III2" teamB="IV1" scoreA={20} scoreB={0} tech />
            </div>

            {/* Quarter Finals (4 matches, vertically centered between pairs) */}
            <div className="flex flex-col justify-around w-[135px] shrink-0" style={{ gap: '28px', paddingTop: '18px', paddingBottom: '18px' }}>
              <BracketMatch teamA="IV6" teamB="I3" scoreA={62} scoreB={46} />
              <BracketMatch teamA="IV3" teamB="II3" date="23.3" />
              <BracketMatch teamA="III5" teamB="II4" date="27.3" />
              <BracketMatch teamA="III2" teamB="III3" date="26.3" />
            </div>

            {/* Semi Finals (2 matches) */}
            <div className="flex flex-col justify-around w-[135px] shrink-0" style={{ paddingTop: '50px', paddingBottom: '50px' }}>
              <BracketMatch teamA="?" teamB="?" />
              <div style={{ height: '40px' }} />
              <BracketMatch teamA="?" teamB="?" />
            </div>

            {/* Final (1 match) */}
            <div className="flex flex-col justify-center w-[135px] shrink-0">
              <BracketMatch teamA="?" teamB="?" isFinal />
            </div>
          </div>
        </div>
      )}

      {/* ══════ RESULTS TAB ══════ */}
      {activeTab === 'results' && (
        <div className="space-y-2 animate-fade-in">
          {playedMatches.map((m, i) => {
            const aWon = (m.scoreA || 0) > (m.scoreB || 0)
            return (
              <div
                key={m.id}
                className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 transition-all"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">{m.round} finala</span>
                  {m.technical && <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">TEH.</span>}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getClassColor(m.teamA)} flex items-center justify-center`}>
                      <span className="text-[10px] font-black text-white">{m.teamA}</span>
                    </div>
                    <span className={`text-sm font-bold ${aWon ? 'text-white' : 'text-zinc-500'}`}>{m.teamA}</span>
                  </div>
                  <div className="flex items-center gap-2 mx-3">
                    <span className={`text-lg font-black tabular-nums ${aWon ? 'text-green-400' : 'text-zinc-500'}`}>{m.scoreA}</span>
                    <span className="text-zinc-600 text-xs">:</span>
                    <span className={`text-lg font-black tabular-nums ${!aWon ? 'text-green-400' : 'text-zinc-500'}`}>{m.scoreB}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className={`text-sm font-bold ${!aWon ? 'text-white' : 'text-zinc-500'}`}>{m.teamB}</span>
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getClassColor(m.teamB)} flex items-center justify-center`}>
                      <span className="text-[10px] font-black text-white">{m.teamB}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ══════ TEAMS TAB ══════ */}
      {activeTab === 'teams' && (
        <div className="space-y-2 animate-fade-in">
          {[...teamStats.values()]
            .sort((a, b) => b.wins - a.wins || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst))
            .map((team, i) => {
              const diff = team.pointsFor - team.pointsAgainst
              const isFav = favorites.has(team.name)
              return (
                <button
                  key={team.name}
                  onClick={() => toggleFavorite(team.name)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all active:scale-[0.98] ${
                    isFav ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-zinc-900/80 border border-zinc-800'
                  }`}
                >
                  <span className="text-xs font-bold text-zinc-500 w-5">{i + 1}.</span>
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getClassColor(team.name)} flex items-center justify-center shrink-0`}>
                    <span className="text-[10px] font-black text-white">{team.name}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-bold ${isFav ? 'text-orange-300' : 'text-white'}`}>
                      {isFav ? '❤️ ' : ''}{team.name}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {team.wins}W {team.losses}L • {team.pointsFor} bodova
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold tabular-nums ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {diff > 0 ? '+' : ''}{diff}
                    </p>
                    <p className="text-[10px] text-zinc-500">razlika</p>
                  </div>
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}

// ── Bracket Match Component ─────────────────────────────────────────────
function BracketMatch({ teamA, teamB, scoreA, scoreB, date, tech, isBye, isFinal }: {
  teamA: string; teamB: string; scoreA?: number; scoreB?: number; date?: string; tech?: boolean; isBye?: boolean; isFinal?: boolean
}) {
  const played = scoreA !== undefined && scoreB !== undefined
  const aWon = played && scoreA! > scoreB!
  const bWon = played && scoreB! > scoreA!
  return (
    <div className={`rounded-lg overflow-hidden border ${isFinal ? 'border-amber-500/40 bg-amber-500/5' : 'border-zinc-700/60 bg-zinc-900/60'}`}>
      <div className={`flex items-center justify-between px-2 py-1.5 border-b border-zinc-700/40 ${aWon ? 'bg-green-500/10' : ''}`}>
        <span className={`text-[11px] font-bold ${isBye && teamA === '—' ? 'text-zinc-600' : aWon ? 'text-green-400' : 'text-zinc-300'}`}>{teamA}</span>
        {played && <span className={`text-[11px] font-bold tabular-nums ${aWon ? 'text-green-400' : 'text-zinc-500'}`}>{scoreA}</span>}
      </div>
      <div className={`flex items-center justify-between px-2 py-1.5 ${bWon ? 'bg-green-500/10' : ''}`}>
        <span className={`text-[11px] font-bold ${bWon ? 'text-green-400' : teamB === '?' ? 'text-zinc-600' : 'text-zinc-300'}`}>{teamB}</span>
        {played && <span className={`text-[11px] font-bold tabular-nums ${bWon ? 'text-green-400' : 'text-zinc-500'}`}>{scoreB}</span>}
        {!played && date && <span className="text-[9px] text-zinc-600">{date}</span>}
        {tech && <span className="text-[8px] text-red-400 font-bold">TEH</span>}
      </div>
    </div>
  )
}

// ── Team Badge Component ───────────────────────────────────────────────
function TeamBadge({ name, isFav, onFav, right }: { name: string; isFav: boolean; onFav: () => void; right?: boolean }) {
  return (
    <div className={`flex items-center gap-2 flex-1 ${right ? 'flex-row-reverse' : ''}`}>
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getClassColor(name)} flex items-center justify-center shadow-lg`}>
        <span className="text-xs font-black text-white">{name}</span>
      </div>
      <div className={right ? 'text-right' : ''}>
        <p className="text-sm font-bold text-white">{name}</p>
        <button
          onClick={(e) => { e.stopPropagation(); onFav() }}
          className="transition-all active:scale-90"
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? 'text-red-500 fill-red-500' : 'text-zinc-600'}`} />
        </button>
      </div>
    </div>
  )
}
