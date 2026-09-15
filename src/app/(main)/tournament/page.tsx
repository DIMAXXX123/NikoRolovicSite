'use client'

import { useState, useEffect } from 'react'
import { track } from '@/lib/analytics'
import { Star, Flame, Timer, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ── Types ──────────────────────────────────────────────────────────────
type Match = {
  id: string
  round: '1/8' | '1/4' | '1/2' | 'finale'
  teamA: string
  teamB: string
  scoreA?: number
  scoreB?: number
  winner?: string
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
  { id: 'q2', round: '1/4', teamA: 'III5', teamB: 'II4', winner: 'III5', date: '27.3', time: '12:45', played: true },
  { id: 'q3', round: '1/4', teamA: 'IV3', teamB: 'II3', winner: 'II3', date: '23.3', time: '12:45', played: true },
  { id: 'q4', round: '1/4', teamA: 'III2', teamB: 'III3', winner: 'III2', date: '26.3', time: '12:45', played: true },
  // Semi Finals — 31.3
  { id: 's1', round: '1/2', teamA: 'IV6', teamB: 'II3', winner: 'II3', date: '31.3', time: '12:45', played: true },
  { id: 's2', round: '1/2', teamA: 'III5', teamB: 'III2', winner: 'III5', date: '31.3', time: '12:45', played: true },
  // Finale
  { id: 'f1', round: 'finale', teamA: 'II3', teamB: 'III5', date: 'TBD', time: '12:45', played: false },
]

const QUALIFIED = ['IV6', 'III5', 'II3', 'III3', 'II4', 'IV3', 'I3', 'III2']

// Class-year colours from the §2 palette: solid colour for the tint, darker text for contrast on the tint.
const CLASS_COLORS: Record<string, { fill: string; text: string }> = {
  'I': { fill: '#58CC02', text: '#58A700' },
  'II': { fill: '#1CB0F6', text: '#1899D6' },
  'III': { fill: '#CE82FF', text: '#A560E8' },
  'IV': { fill: '#FFC800', text: '#C79000' },
}

function getClassColor(team: string) {
  const roman = team.match(/^(I{1,3}V?|IV)/)?.[0] || ''
  return CLASS_COLORS[roman] || { fill: '#AFAFAF', text: '#777777' }
}

/** Team monogram circle: 18% tint of the class colour over white, 2px tinted border. */
function TeamMonogram({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const c = getClassColor(name)
  const dim = size === 'lg' ? 'size-11 text-[12px]' : size === 'sm' ? 'size-9 text-[10px]' : 'size-10 text-[11px]'
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border-2 font-black ${dim}`}
      style={{
        background: `color-mix(in srgb, ${c.fill} 18%, white)`,
        borderColor: `color-mix(in srgb, ${c.fill} 45%, white)`,
        color: c.text,
      }}
    >
      {name}
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────
export default function TournamentPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'bracket' | 'grid' | 'results' | 'teams'>('bracket')
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    track('tournament_view')
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
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Button size="icon" onClick={() => router.back()} aria-label="Nazad">
            <ArrowLeft strokeWidth={2.6} />
          </Button>
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 text-3xl"
            style={{
              background: 'color-mix(in srgb, #FF9600 18%, white)',
              borderColor: 'color-mix(in srgb, #FF9600 45%, white)',
            }}
          >
            🏀
          </div>
          <div className="min-w-0">
            <h1 className="text-[26px] leading-[1.2] tracking-[-0.01em] font-extrabold text-heading">Turnir u košarci</h1>
            <p className="text-[13px] font-bold text-muted-foreground">Gimnazija Niko Rolović — Mart 2026</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="gold">
            <Flame strokeWidth={2.6} />
            {playedMatches.length} odigrano
          </Badge>
          <Badge variant="outline">
            <Timer strokeWidth={2.6} />
            {upcomingMatches.length} preostalo
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs id="tournament-tabs" value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-1 px-0 text-[11px]">
              <span aria-hidden="true">{tab.icon}</span> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* ══════ BRACKET TAB ══════ */}
      {activeTab === 'bracket' && (
        <div className="space-y-5 animate-fade-in">
          {/* Upcoming */}
          {upcomingMatches.length > 0 && (
            <div>
              <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading mb-3 flex items-center gap-2">
                <Timer className="w-5 h-5 text-orange" strokeWidth={2.6} /> Sljedeći mečevi
              </h2>
              <div className="space-y-2.5 animate-stagger-scale">
                {upcomingMatches.map((m, i) => (
                  <Card
                    key={m.id}
                    className="gap-3"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-orange">{m.round} finala</span>
                      <span className="text-[13px] font-bold text-muted-foreground">{m.date} • {m.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <TeamBadge name={m.teamA} isFav={favorites.has(m.teamA)} onFav={() => toggleFavorite(m.teamA)} />
                      <span className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-disabled">VS</span>
                      <TeamBadge name={m.teamB} isFav={favorites.has(m.teamB)} onFav={() => toggleFavorite(m.teamB)} right />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Qualified teams */}
          <div>
            <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-gold fill-gold" strokeWidth={2.6} /> U četvrtfinalu
            </h2>
            <div className="flex flex-wrap gap-2">
              {QUALIFIED.map(team => (
                <button
                  key={team}
                  onClick={() => toggleFavorite(team)}
                  className={`inline-flex h-11 items-center rounded-xl border-2 px-3.5 text-[12px] font-extrabold uppercase tracking-[0.04em] transition-[transform,box-shadow,background-color,color] duration-[80ms] active:translate-y-[2px] active:shadow-none ${
                    favorites.has(team)
                      ? 'bg-[#FFF4C4] border-[#FFE28A] text-[#C79000] shadow-[0_2px_0_#FFE28A]'
                      : 'bg-background border-border text-muted-foreground shadow-[0_2px_0_var(--color-border)]'
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
        <div className="animate-fade-in pb-4">
          {/* Column headers */}
          {/* Fits a 390px screen: four equal columns, no horizontal scroll */}
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            <div className="text-center text-[10px] font-extrabold tracking-[0.04em] text-muted-foreground uppercase">Osmina</div>
            <div className="text-center text-[10px] font-extrabold tracking-[0.04em] text-muted-foreground uppercase">Četvrt</div>
            <div className="text-center text-[10px] font-extrabold tracking-[0.04em] text-muted-foreground uppercase">Polu</div>
            <div className="text-center text-[10px] font-extrabold tracking-[0.04em] text-[#C79000] uppercase">🏆 Finale</div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 items-stretch">
            {/* Round 1 - 1/8 Finals (8 matches) */}
            <div className="flex flex-col gap-1.5 min-w-0">
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
            <div className="flex flex-col justify-around min-w-0" style={{ paddingTop: '22px', paddingBottom: '22px' }}>
              <BracketMatch teamA="IV6" teamB="I3" scoreA={62} scoreB={46} />
              <BracketMatch teamA="IV3" teamB="II3" winner="II3" />
              <BracketMatch teamA="III5" teamB="II4" winner="III5" />
              <BracketMatch teamA="III2" teamB="III3" winner="III2" />
            </div>

            {/* Semi Finals (2 matches) */}
            <div className="flex flex-col justify-around min-w-0" style={{ paddingTop: '70px', paddingBottom: '70px' }}>
              <BracketMatch teamA="IV6" teamB="II3" winner="II3" />
              <div style={{ height: '40px' }} />
              <BracketMatch teamA="III5" teamB="III2" winner="III5" />
            </div>

            {/* Final (1 match) */}
            <div className="flex flex-col justify-center min-w-0">
              <BracketMatch teamA="II3" teamB="III5" isFinal />
            </div>
          </div>
        </div>
      )}

      {/* ══════ RESULTS TAB ══════ */}
      {activeTab === 'results' && (
        <div className="space-y-2.5 animate-fade-in animate-stagger-scale">
          {playedMatches.map((m, i) => {
            const aWon = m.winner ? m.winner === m.teamA : (m.scoreA || 0) > (m.scoreB || 0)
            return (
              <Card
                key={m.id}
                className="gap-2"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{m.round} finala</span>
                  {m.technical && <Badge variant="destructive">TEH.</Badge>}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <TeamMonogram name={m.teamA} size="sm" />
                    <span className={`text-[15px] font-extrabold truncate ${aWon ? 'text-heading' : 'text-muted-foreground'}`}>{m.teamA}</span>
                  </div>
                  <div className="flex items-center gap-2 mx-3">
                    {m.scoreA !== undefined ? (
                      <>
                        <span className={`text-[20px] font-black tabular-nums ${aWon ? 'text-primary-text' : 'text-muted-foreground'}`}>{m.scoreA}</span>
                        <span className="text-disabled text-[13px] font-extrabold">:</span>
                        <span className={`text-[20px] font-black tabular-nums ${!aWon ? 'text-primary-text' : 'text-muted-foreground'}`}>{m.scoreB}</span>
                      </>
                    ) : (
                      <span className="text-[15px] font-extrabold text-primary-text">✓ {m.winner}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    <span className={`text-[15px] font-extrabold truncate ${!aWon ? 'text-heading' : 'text-muted-foreground'}`}>{m.teamB}</span>
                    <TeamMonogram name={m.teamB} size="sm" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ══════ TEAMS TAB ══════ */}
      {activeTab === 'teams' && (
        <div className="space-y-2.5 animate-fade-in animate-stagger-scale">
          {[...teamStats.values()]
            .sort((a, b) => b.wins - a.wins || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst))
            .map((team, i) => {
              const diff = team.pointsFor - team.pointsAgainst
              const isFav = favorites.has(team.name)
              return (
                <button
                  key={team.name}
                  onClick={() => toggleFavorite(team.name)}
                  className={`w-full flex items-center gap-3 min-h-[64px] px-4 py-3 rounded-2xl border-2 text-left transition-[transform,box-shadow,background-color,border-color] duration-[80ms] active:translate-y-[2px] active:shadow-none ${
                    isFav
                      ? 'bg-[#FFF9E0] border-[#FFE28A] shadow-[0_2px_0_#FFE28A]'
                      : 'bg-background border-border shadow-[0_2px_0_var(--color-border)]'
                  }`}
                >
                  <span className="text-[13px] font-extrabold text-muted-foreground w-5 tabular-nums">{i + 1}.</span>
                  <TeamMonogram name={team.name} size="lg" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className={`text-[17px] leading-[1.3] font-extrabold truncate ${isFav ? 'text-[#C79000]' : 'text-heading'}`}>
                      {isFav ? '❤️ ' : ''}{team.name}
                    </p>
                    <p className="text-[13px] font-bold text-muted-foreground">
                      {team.wins}W {team.losses}L • {team.pointsFor} bodova
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[17px] font-black tabular-nums ${diff > 0 ? 'text-primary-text' : 'text-destructive'}`}>
                      {diff > 0 ? '+' : ''}{diff}
                    </p>
                    <p className="text-[13px] font-bold text-muted-foreground">razlika</p>
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
function BracketMatch({ teamA, teamB, scoreA, scoreB, date, tech, isBye, isFinal, winner }: {
  teamA: string; teamB: string; scoreA?: number; scoreB?: number; date?: string; tech?: boolean; isBye?: boolean; isFinal?: boolean; winner?: string
}) {
  const played = (scoreA !== undefined && scoreB !== undefined) || !!winner
  const aWon = winner ? winner === teamA : (scoreA !== undefined && scoreB !== undefined && scoreA! > scoreB!)
  const bWon = winner ? winner === teamB : (scoreA !== undefined && scoreB !== undefined && scoreB! > scoreA!)
  return (
    <div className={`rounded-xl overflow-hidden border-2 ${isFinal ? 'border-[#FFE28A] bg-[#FFF9E0] shadow-[0_2px_0_#FFE28A]' : 'border-border bg-background shadow-[0_2px_0_var(--color-border)]'}`}>
      <div className={`flex items-center justify-between gap-1 px-1.5 py-1 border-b-2 border-border ${aWon ? 'bg-primary-light' : ''}`}>
        <span className={`text-[11px] font-extrabold truncate ${isBye && teamA === '—' ? 'text-disabled' : aWon ? 'text-primary-text' : 'text-foreground'}`}>{teamA}</span>
        {scoreA !== undefined && <span className={`text-[11px] font-extrabold tabular-nums ${aWon ? 'text-primary-text' : 'text-muted-foreground'}`}>{scoreA}</span>}
        {winner && scoreA === undefined && aWon && <span className="text-[12px] font-extrabold text-primary-text">✓</span>}
      </div>
      <div className={`flex items-center justify-between gap-1 px-1.5 py-1 ${bWon ? 'bg-primary-light' : ''}`}>
        <span className={`text-[11px] font-extrabold truncate ${bWon ? 'text-primary-text' : teamB === '?' ? 'text-disabled' : 'text-foreground'}`}>{teamB}</span>
        {scoreB !== undefined && <span className={`text-[11px] font-extrabold tabular-nums ${bWon ? 'text-primary-text' : 'text-muted-foreground'}`}>{scoreB}</span>}
        {winner && scoreB === undefined && bWon && <span className="text-[12px] font-extrabold text-primary-text">✓</span>}
        {!played && date && <span className="text-[11px] font-bold text-disabled">{date}</span>}
        {tech && <span className="text-[9px] font-extrabold uppercase text-destructive">TEH</span>}
      </div>
    </div>
  )
}

// ── Team Badge Component ───────────────────────────────────────────────
function TeamBadge({ name, isFav, onFav, right }: { name: string; isFav: boolean; onFav: () => void; right?: boolean }) {
  return (
    <div className={`flex items-center gap-2 flex-1 min-w-0 ${right ? 'flex-row-reverse' : ''}`}>
      <TeamMonogram name={name} size="lg" />
      <div className={`flex items-center gap-1 min-w-0 ${right ? 'flex-row-reverse text-right' : ''}`}>
        <p className="text-[17px] leading-[1.3] font-extrabold text-heading truncate">{name}</p>
        <button
          onClick={(e) => { e.stopPropagation(); onFav() }}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform active:scale-90 hover:bg-muted"
          aria-label={`Omiljeni tim ${name}`}
          aria-pressed={isFav}
        >
          <Star className={`w-5 h-5 ${isFav ? 'text-gold fill-gold' : 'text-disabled'}`} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  )
}
