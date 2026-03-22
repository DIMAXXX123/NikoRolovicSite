'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, LogOut, ClipboardCopy, ExternalLink, Loader2, BookOpen, AlertCircle } from 'lucide-react'

const SUPABASE_URL = 'https://ydcbxqrnmnbceyzqgbui.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3Mzg0NjYsImV4cCI6MjA4OTMxNDQ2Nn0.y-lauFU8c9eTP0RJL_zveEF4JE96KiTvJ46FrvYZmfY'

const STORAGE_KEY = 'ednevnik_data'
const TOKEN_KEY = 'ednevnik_token'

const GRADE_COLORS: Record<number, string> = {
  5: '#4CAF50',
  4: '#2196F3',
  3: '#FFC107',
  2: '#FF9800',
  1: '#F44336',
}

const GRADE_BG: Record<number, string> = {
  5: 'bg-[#4CAF50]/15 text-[#4CAF50] border-[#4CAF50]/30',
  4: 'bg-[#2196F3]/15 text-[#2196F3] border-[#2196F3]/30',
  3: 'bg-[#FFC107]/15 text-[#FFC107] border-[#FFC107]/30',
  2: 'bg-[#FF9800]/15 text-[#FF9800] border-[#FF9800]/30',
  1: 'bg-[#F44336]/15 text-[#F44336] border-[#F44336]/30',
}

interface EDnevnikGrade {
  grade: number
  type: string
  date: string
}

interface EDnevnikSubject {
  name: string
  grades: EDnevnikGrade[]
  finalGrade: number | null
  average: number | null
}

interface EDnevnikData {
  user: { name: string; class: string } | null
  subjects: EDnevnikSubject[]
  fetchedAt: string
}

function parseGrade(val: unknown): number {
  const n = Number(val)
  return n >= 1 && n <= 5 ? n : 0
}

export default function EDnevnikPage() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<EDnevnikData | null>(null)
  const [tokenInput, setTokenInput] = useState('')
  const [showInstructions, setShowInstructions] = useState(false)
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY)
    const token = localStorage.getItem(TOKEN_KEY)
    if (cached && token) {
      try {
        setData(JSON.parse(cached))
        setConnected(true)
      } catch { /* ignore */ }
    }
  }, [])

  const fetchEDnevnik = useCallback(async (token: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token

      const res = await fetch(`${SUPABASE_URL}/functions/v1/ednevnik-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${authToken || SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ token, endpoint: 'getuser' }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Greška ${res.status}`)
      }

      const result = await res.json()

      // Parse the response into our format
      const subjects: EDnevnikSubject[] = []
      if (result.subjects && Array.isArray(result.subjects)) {
        for (const sub of result.subjects) {
          const grades: EDnevnikGrade[] = []
          if (sub.grades && Array.isArray(sub.grades)) {
            for (const g of sub.grades) {
              const grade = parseGrade(g.grade || g.value || g.ocjena)
              if (grade > 0) {
                grades.push({
                  grade,
                  type: g.type || g.tip || g.vrsta || 'Ocjena',
                  date: g.date || g.datum || '',
                })
              }
            }
          }
          const finalGrade = parseGrade(sub.finalGrade || sub.zakljucna || sub.final) || null
          const avg = grades.length > 0
            ? grades.reduce((sum, g) => sum + g.grade, 0) / grades.length
            : null
          subjects.push({
            name: sub.name || sub.naziv || sub.subject || 'Nepoznat predmet',
            grades,
            finalGrade,
            average: avg,
          })
        }
      }

      const edData: EDnevnikData = {
        user: result.user ? { name: result.user.name || result.user.ime || '', class: result.user.class || result.user.razred || '' } : null,
        subjects,
        fetchedAt: new Date().toISOString(),
      }

      setData(edData)
      setConnected(true)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(edData))
      localStorage.setItem(TOKEN_KEY, token)
    } catch (err: any) {
      setError(err.message || 'Greška pri povezivanju sa eDnevnikom')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  function handleConnect() {
    const token = tokenInput.trim()
    if (!token) {
      setError('Molimo unesite token')
      return
    }
    fetchEDnevnik(token)
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
    setData(null)
    setConnected(false)
    setTokenInput('')
    setError(null)
  }

  function handleRefresh() {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) fetchEDnevnik(token)
  }

  // Calculate overall average
  const overallAvg = data?.subjects
    ? (() => {
        const finals = data.subjects.filter(s => s.finalGrade && s.finalGrade > 0).map(s => s.finalGrade!)
        if (finals.length === 0) {
          const avgs = data.subjects.filter(s => s.average && s.average > 0).map(s => s.average!)
          if (avgs.length === 0) return null
          return avgs.reduce((a, b) => a + b, 0) / avgs.length
        }
        return finals.reduce((a, b) => a + b, 0) / finals.length
      })()
    : null

  function avgGradient(avg: number): string {
    if (avg >= 4.5) return 'from-[#4CAF50] to-emerald-600'
    if (avg >= 3.5) return 'from-[#2196F3] to-blue-600'
    if (avg >= 2.5) return 'from-[#FFC107] to-amber-600'
    if (avg >= 1.5) return 'from-[#FF9800] to-orange-600'
    return 'from-[#F44336] to-red-600'
  }

  function avgLabel(avg: number): string {
    if (avg >= 4.5) return 'Odličan'
    if (avg >= 3.5) return 'Vrlo dobar'
    if (avg >= 2.5) return 'Dobar'
    if (avg >= 1.5) return 'Dovoljan'
    return 'Nedovoljan'
  }

  const circumference = 2 * Math.PI * 44
  const avgPercent = overallAvg ? (overallAvg / 5) * 100 : 0
  const offset = circumference - (avgPercent / 100) * circumference
  const gradedCount = data?.subjects.filter(s => (s.finalGrade && s.finalGrade > 0) || (s.average && s.average > 0)).length || 0

  // ========== CONNECTED: SHOW GRADES ==========
  if (connected && data) {
    return (
      <div className="space-y-5 animate-fade-in pb-8 -mx-4 px-3">
        <div className="flex items-center justify-between pt-1">
          <h1 className="text-2xl font-bold gradient-text">eDnevnik</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="text-xs text-muted-foreground hover:text-[#7c5cfc] transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Osveži'}
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/[0.04]"
            >
              <LogOut className="w-3 h-3" /> Odjavi
            </button>
          </div>
        </div>

        {data.user && (
          <p className="text-xs text-muted-foreground -mt-3">
            {data.user.name} · {data.user.class}
          </p>
        )}

        {/* Overall average card */}
        {overallAvg !== null && (
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${avgGradient(overallAvg)} p-6 shadow-xl`}>
            <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-white/70 text-sm font-medium">Ukupan prosjek</p>
                <p className="text-white text-lg font-bold">{avgLabel(overallAvg)}</p>
                <p className="text-white/50 text-xs font-medium">{gradedCount}/{data.subjects.length} predmeta</p>
              </div>

              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                  <circle
                    cx="50" cy="50" r="44"
                    fill="none"
                    stroke="white"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="animate-circular-progress"
                    style={{
                      filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.3))',
                      ['--circumference' as string]: circumference,
                      ['--offset' as string]: offset,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white drop-shadow-lg">{overallAvg.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subject cards */}
        <div className="space-y-2.5">
          {data.subjects.map((subject) => {
            const isExpanded = expandedSubject === subject.name

            return (
              <div
                key={subject.name}
                className="rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setExpandedSubject(isExpanded ? null : subject.name)}
                  className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-white/[0.02] active:bg-white/[0.04]"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{subject.name}</h3>
                    {!isExpanded && subject.grades.length > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {subject.grades.length} ocjena{subject.average ? ` · prosjek ${subject.average.toFixed(2)}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Final grade circle */}
                    {subject.finalGrade ? (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg font-bold text-sm text-white"
                        style={{ backgroundColor: GRADE_COLORS[subject.finalGrade] || '#666' }}
                      >
                        {subject.finalGrade}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-dashed border-[#1a1a2e] flex items-center justify-center">
                        <span className="text-xs text-muted-foreground/50">—</span>
                      </div>
                    )}
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-5 space-y-3 animate-fade-in border-t border-[#1a1a2e]">
                    {/* Average bar */}
                    {subject.average !== null && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Prosjek</span>
                          <span className="text-sm font-bold" style={{ color: GRADE_COLORS[Math.round(subject.average)] || '#666' }}>
                            {subject.average.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(subject.average / 5) * 100}%`,
                              backgroundColor: GRADE_COLORS[Math.round(subject.average)] || '#666',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Individual grades */}
                    {subject.grades.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-2.5">Ocjene</p>
                        <div className="flex flex-wrap gap-2">
                          {subject.grades.map((g, idx) => (
                            <div
                              key={idx}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border ${GRADE_BG[g.grade] || 'bg-white/[0.04] text-muted-foreground border-[#1a1a2e]'}`}
                            >
                              <span>{g.grade}</span>
                              {g.type && (
                                <span className="font-normal opacity-70 text-[10px]">{g.type}</span>
                              )}
                              {g.date && (
                                <span className="font-normal opacity-50 text-[10px]">{g.date}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {subject.grades.length === 0 && (
                      <p className="text-xs text-muted-foreground/50 mt-3 italic">Nema unesenih ocjena</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {data.fetchedAt && (
          <p className="text-[10px] text-muted-foreground/40 text-center">
            Podatci preuzeti: {new Date(data.fetchedAt).toLocaleString('sr-Latn')}
          </p>
        )}
      </div>
    )
  }

  // ========== NOT CONNECTED: SETUP FLOW ==========
  return (
    <div className="space-y-5 animate-fade-in pb-8 -mx-4 px-3">
      <div className="pt-1">
        <h1 className="text-2xl font-bold gradient-text">eDnevnik</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Poveži svoj eDnevnik nalog da vidiš ocjene
        </p>
      </div>

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7c5cfc] to-[#5b3fd9] p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative text-center space-y-3">
          <BookOpen className="w-12 h-12 mx-auto text-white/80" />
          <h2 className="text-lg font-bold text-white">Poveži eDnevnik</h2>
          <p className="text-sm text-white/70">
            Pregledaj svoje ocjene iz eDnevnika direktno u aplikaciji
          </p>
        </div>
      </div>

      {/* Instructions toggle */}
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className="w-full py-3.5 rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/[0.04] transition-all"
      >
        <span>Kako da dobijem token?</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${showInstructions ? 'rotate-180' : ''}`} />
      </button>

      {showInstructions && (
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] p-5 space-y-4 animate-fade-in">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#7c5cfc]/20 text-[#7c5cfc] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-sm font-medium">Otvori eDnevnik</p>
                <a
                  href="https://dnevnik.edu.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#7c5cfc] hover:underline flex items-center gap-1 mt-0.5"
                >
                  dnevnik.edu.me <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#7c5cfc]/20 text-[#7c5cfc] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <p className="text-sm font-medium">Prijavi se na svoj nalog</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#7c5cfc]/20 text-[#7c5cfc] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <div>
                <p className="text-sm font-medium">Otvori konzolu preglednika</p>
                <p className="text-xs text-muted-foreground mt-0.5">Pritisni F12, zatim klikni na tab &quot;Console&quot;</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#7c5cfc]/20 text-[#7c5cfc] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
              <div>
                <p className="text-sm font-medium">Kopiraj token</p>
                <p className="text-xs text-muted-foreground mt-0.5 mb-2">Unesi ovu komandu u konzolu:</p>
                <div className="relative">
                  <code className="block text-xs bg-white/[0.04] border border-[#1a1a2e] rounded-xl p-3 text-[#7c5cfc] font-mono break-all">
                    copy(localStorage.getItem(&apos;MEIS_EDU_TOKEN&apos;))
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("copy(localStorage.getItem('MEIS_EDU_TOKEN'))")
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
                    title="Kopiraj komandu"
                  >
                    <ClipboardCopy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#7c5cfc]/20 text-[#7c5cfc] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">5</span>
              <p className="text-sm font-medium">Zalijepi token ispod i klikni &quot;Poveži&quot;</p>
            </div>
          </div>
        </div>
      )}

      {/* Token input */}
      <div className="rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
            eDnevnik Token
          </label>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Zalijepi token ovdje..."
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-[#1a1a2e] text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#7c5cfc]/50 focus:ring-1 focus:ring-[#7c5cfc]/20 transition-all"
            onKeyDown={(e) => { if (e.key === 'Enter') handleConnect() }}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={loading || !tokenInput.trim()}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7c5cfc] to-[#5b3fd9] text-white text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(124,92,252,0.3)] hover:shadow-[0_0_30px_rgba(124,92,252,0.5)] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Povezivanje...
            </>
          ) : (
            'Poveži eDnevnik'
          )}
        </button>
      </div>
    </div>
  )
}
