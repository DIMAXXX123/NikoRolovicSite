'use client'

import { useEffect, useState, useCallback } from 'react'
import { track } from '@/lib/analytics'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, ClipboardCopy, ExternalLink, Loader2, BookOpen, AlertCircle, Smartphone, Monitor, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { makeDemoData } from './cilj'
import { DnevnikView, type DnevnikAbsence } from './dnevnik-view'

const SUPABASE_URL = 'https://ydcbxqrnmnbceyzqgbui.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3Mzg0NjYsImV4cCI6MjA4OTMxNDQ2Nn0.y-lauFU8c9eTP0RJL_zveEF4JE96KiTvJ46FrvYZmfY'

const STORAGE_KEY = 'ednevnik_data'
const TOKEN_KEY = 'ednevnik_token'
const DEMO_TOKEN = 'demo'

const H1 = 'text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading'

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
  absences?: DnevnikAbsence[]
  fetchedAt: string
  demo?: boolean
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
  const [guide, setGuide] = useState<'phone' | 'desktop'>('phone')
  const [copied, setCopied] = useState<'bookmarklet' | 'console' | null>(null)
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
    track(localStorage.getItem(TOKEN_KEY) ? 'ednevnik_sync' : 'ednevnik_connect')
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
        // eDnevnik answers with JSON like {"msg":"Sesija je istekla"} — show the message, not the JSON.
        let message = text
        try {
          const parsed = JSON.parse(text) as { msg?: string; error?: string }
          message = parsed.msg || parsed.error || text
        } catch { /* plain text */ }
        if (/istekla|expired/i.test(message)) message = 'Sesija na eDnevniku je istekla — prijavi se ponovo na dnevnik.edu.me i ponovi korak.'
        throw new Error(message || `Greška ${res.status}`)
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

      // Absences, when the dnevnik returns them (field names vary — be lenient).
      const rawAbs = (result.absences ?? result.izostanci ?? []) as Array<Record<string, unknown>>
      const absences: DnevnikAbsence[] = Array.isArray(rawAbs)
        ? rawAbs.slice(0, 500).map((a) => {
            const status = String(a.status ?? a.opravdano ?? '')
            return {
              date: String(a.date ?? a.datum ?? ''),
              hours: Math.min(8, Math.max(1, Number(a.hours ?? a.casovi ?? a.sati ?? 1) || 1)),
              justified: typeof a.justified === 'boolean' ? a.justified : /^(da|opravdan)/i.test(status) ? true : /^(ne|neopravdan)/i.test(status) ? false : null,
            }
          }).filter((a) => a.date)
        : []

      const edData: EDnevnikData = {
        user: result.user ? { name: result.user.name || result.user.ime || '', class: result.user.class || result.user.razred || '' } : null,
        subjects,
        absences,
        fetchedAt: new Date().toISOString(),
      }

      setData(edData)
      setConnected(true)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(edData))
      localStorage.setItem(TOKEN_KEY, token)
      // Sync to the account so the phone/computer pick it up without re-connecting.
      if (session?.user) {
        await supabase.from('ednevnik_tokens').upsert({ user_id: session.user.id, token, updated_at: new Date().toISOString() })
        // Škola panel: the pupil's own marks (and absences, when the dnevnik
        // returns them) go to school_grades under their profile — aggregated
        // with k-anonymity, never shown per pupil. Failure here is silent.
        void fetch('/api/skola/sync', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ subjects: subjects.map((s) => ({ name: s.name, grades: s.grades.map((g) => ({ grade: g.grade, type: g.type, date: g.date })) })), absences }),
        }).catch(() => undefined)
      }
    } catch (err) {
      setError((err as { message?: string }).message || 'Greška pri povezivanju sa eDnevnikom')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  /** Demo connection: invented marks, instantly — no MEIS account needed. */
  async function handleDemoConnect() {
    track('ednevnik_connect', { meta: { demo: true } })
    const { data: { user } } = await supabase.auth.getUser()
    const demo = makeDemoData(user?.id ?? 'demo')
    const edData: EDnevnikData = { ...demo, demo: true }
    setData(edData)
    setConnected(true)
    setError(null)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(edData))
    localStorage.setItem(TOKEN_KEY, DEMO_TOKEN)
  }

  function handleConnect() {
    const token = tokenInput.trim()
    if (!token) {
      setError('Molimo unesite token')
      return
    }
    fetchEDnevnik(token)
  }

  async function handleLogout() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('ednevnik_tokens').delete().eq('user_id', user.id)
    setData(null)
    setConnected(false)
    setTokenInput('')
    setError(null)
  }

  function handleRefresh() {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token === DEMO_TOKEN) return void handleDemoConnect()
    if (token) fetchEDnevnik(token)
  }

  // No token on this device → use the one saved in the account (connected elsewhere).
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(TOKEN_KEY) || window.location.hash.includes('token=')) return
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data } = await supabase.from('ednevnik_tokens').select('token').eq('user_id', user.id).maybeSingle()
      if (data?.token && data.token !== DEMO_TOKEN && !cancelled) fetchEDnevnik(data.token)
    })()
    return () => { cancelled = true }
  }, [supabase, fetchEDnevnik])

  // The phone bookmarklet returns here as /ednevnik#token=… — the token stays
  // in the fragment, so it never reaches the server or its logs.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const m = window.location.hash.match(/[#&]token=([^&]+)/)
    if (!m) return
    const token = decodeURIComponent(m[1]).trim()
    window.history.replaceState(null, '', window.location.pathname)
    if (token) fetchEDnevnik(token)
  }, [fetchEDnevnik])

  function bookmarkletCode() {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `javascript:(function(){var t=localStorage.getItem('MEIS_EDU_TOKEN');if(!t){alert('Prvo se prijavi na eDnevnik, pa ponovo otvori ovaj bookmark.');return;}location.href='${origin}/ednevnik#token='+encodeURIComponent(t);})()`
  }

  async function copyText(text: string, what: 'bookmarklet' | 'console') {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      setTimeout(() => setCopied(null), 2000)
    } catch { /* clipboard unavailable */ }
  }

  // Calculate overall average — use finalGrade when available, fall back to average
  // ========== CONNECTED ==========
  if (connected && data) {
    return <DnevnikView data={data} loading={loading} onRefresh={handleRefresh} onLogout={handleLogout} />
  }

  // ========== NOT CONNECTED: SETUP FLOW ==========
  return (
    <div className="space-y-5 animate-fade-in pb-8">
      <div className="pt-1">
        <h1 className={H1}>eDnevnik</h1>
        <p className="mt-1 text-[13px] font-bold text-muted-foreground">
          Poveži svoj eDnevnik nalog da vidiš ocjene
        </p>
      </div>

      {/* Hero card */}
      <Card className="items-center gap-3 p-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full border-2 border-primary-light-border bg-primary-light">
          <BookOpen className="size-8 text-primary-text" strokeWidth={2.4} />
        </div>
        <h2 className="text-[20px] font-extrabold leading-[1.25] text-heading">Tvoje ocjene, na jednom mjestu</h2>
        <ul className="w-full text-left space-y-1.5 text-[13px] font-bold text-foreground">
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#58A700] flex-shrink-0 mt-0.5" strokeWidth={3} /><span>Opšti uspjeh i koliko fali do sljedećeg</span></li>
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#58A700] flex-shrink-0 mt-0.5" strokeWidth={3} /><span>Cilj: koje predmete podići i koliko petica treba</span></li>
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#58A700] flex-shrink-0 mt-0.5" strokeWidth={3} /><span>Upozorenje kad ti zaključna visi o jednoj ocjeni</span></li>
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#58A700] flex-shrink-0 mt-0.5" strokeWidth={3} /><span>Izostanci: opravdani, neopravdani, rok za opravdanje</span></li>
        </ul>
        <Button className="w-full h-14 mt-1" onClick={handleDemoConnect}>
          <BookOpen strokeWidth={2.6} /> Poveži eDnevnik
        </Button>
        <p className="text-[12px] font-bold text-muted-foreground">Otvara se odmah. Pravi nalog sa dnevnik.edu.me povezuješ tokenom — ispod.</p>
      </Card>

      {/* Instructions toggle */}
      <Button
        variant="outline"
        onClick={() => setShowInstructions(!showInstructions)}
        className="w-full"
      >
        <span>Imam nalog na dnevnik.edu.me (token)</span>
        <ChevronDown strokeWidth={2.6} className={`transition-transform duration-300 ${showInstructions ? 'rotate-180' : ''}`} />
      </Button>

      {showInstructions && (
        <>
        <Card className="animate-fade-in space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setGuide('phone')} className={`h-11 rounded-xl border-2 text-[12px] font-extrabold uppercase tracking-[0.04em] flex items-center justify-center gap-2 transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none ${guide === 'phone' ? 'border-secondary-light-border bg-secondary-light text-secondary shadow-[0_2px_0_var(--color-secondary-light-border)]' : 'border-border bg-card text-muted-foreground shadow-[0_2px_0_var(--color-border)]'}`}>
              <Smartphone className="size-4" strokeWidth={2.6} /> Telefon
            </button>
            <button type="button" onClick={() => setGuide('desktop')} className={`h-11 rounded-xl border-2 text-[12px] font-extrabold uppercase tracking-[0.04em] flex items-center justify-center gap-2 transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none ${guide === 'desktop' ? 'border-secondary-light-border bg-secondary-light text-secondary shadow-[0_2px_0_var(--color-secondary-light-border)]' : 'border-border bg-card text-muted-foreground shadow-[0_2px_0_var(--color-border)]'}`}>
              <Monitor className="size-4" strokeWidth={2.6} /> Računar
            </button>
          </div>

          {guide === 'phone' ? (
            <div className="space-y-3">
              <div className="rounded-xl border-2 border-primary-light-border bg-[#F4FFEA] p-3 text-[13px] font-bold text-primary-text">Najbrže: poveži eDnevnik jednom na računaru (kartica „Računar“) dok si prijavljen na ovaj sajt — telefon ga sam preuzme sa naloga.</div>
              <p className="text-[13px] font-bold text-muted-foreground">Samo sa telefona: jednom napraviš bookmark. Poslije toga: prijavi se na eDnevnik → tapni bookmark → vraća te ovdje već povezanog.</p>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-secondary-light-border bg-secondary-light text-[11px] font-extrabold text-secondary">1</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-extrabold text-heading">Kopiraj kod bookmarka</p>
                  <Button variant="outline" onClick={() => copyText(bookmarkletCode(), 'bookmarklet')} className="mt-2 w-full">
                    {copied === 'bookmarklet' ? <Check strokeWidth={2.6} /> : <ClipboardCopy strokeWidth={2.4} />}
                    {copied === 'bookmarklet' ? 'Kopirano' : 'Kopiraj kod'}
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-secondary-light-border bg-secondary-light text-[11px] font-extrabold text-secondary">2</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-extrabold text-heading">Otvori eDnevnik u Safariju / Chrome-u i prijavi se</p>
                  <a href="https://www.dnevnik.edu.me" target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex min-h-11 items-center gap-1 text-[13px] font-extrabold text-secondary hover:underline">
                    dnevnik.edu.me <ExternalLink className="size-3.5" strokeWidth={2.6} />
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-secondary-light-border bg-secondary-light text-[11px] font-extrabold text-secondary">3</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-extrabold text-heading">Sačuvaj stranicu kao bookmark i zamijeni mu adresu kopiranim kodom</p>
                  <p className="mt-0.5 text-[13px] font-bold text-muted-foreground">iPhone: Dijeli → Dodaj oznaku (ime npr. „NR eDnevnik“) → Oznake → Uredi → tapni oznaku → u polje adrese zalijepi kod → Gotovo.</p>
                  <p className="mt-0.5 text-[13px] font-bold text-muted-foreground">Android (Chrome): ⋮ → ☆ → Uredi → zalijepi kod u polje URL.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-secondary-light-border bg-secondary-light text-[11px] font-extrabold text-secondary">4</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-extrabold text-heading">Dok si prijavljen na eDnevnik, otvori taj bookmark</p>
                  <p className="mt-0.5 text-[13px] font-bold text-muted-foreground">iPhone: Oznake → „NR eDnevnik“. Android: ukucaj ime bookmarka u adresnu traku i izaberi ga. Vraća te na ovu stranicu i povezuje nalog automatski.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-secondary-light-border bg-secondary-light text-[11px] font-extrabold text-secondary">1</span>
                <div>
                  <p className="text-[15px] font-extrabold text-heading">Otvori eDnevnik</p>
                  <a href="https://www.dnevnik.edu.me" target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex min-h-11 items-center gap-1 text-[13px] font-extrabold text-secondary hover:underline">
                    dnevnik.edu.me <ExternalLink className="size-3.5" strokeWidth={2.6} />
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-secondary-light-border bg-secondary-light text-[11px] font-extrabold text-secondary">2</span>
                <p className="text-[15px] font-extrabold text-heading">Prijavi se na svoj nalog</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-secondary-light-border bg-secondary-light text-[11px] font-extrabold text-secondary">3</span>
                <div>
                  <p className="text-[15px] font-extrabold text-heading">Otvori konzolu preglednika</p>
                  <p className="mt-0.5 text-[13px] font-bold text-muted-foreground">Pritisni F12, zatim klikni na tab &quot;Console&quot;</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-secondary-light-border bg-secondary-light text-[11px] font-extrabold text-secondary">4</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-extrabold text-heading">Kopiraj token</p>
                  <p className="mt-0.5 mb-2 text-[13px] font-bold text-muted-foreground">Unesi ovu komandu u konzolu (na dnevnik.edu.me, poslije prijave):</p>
                  <div className="relative">
                    <code className="block rounded-xl border-2 border-border bg-muted p-3 pr-14 font-mono text-[13px] font-bold break-all text-secondary">
                      copy(localStorage.getItem(&apos;MEIS_EDU_TOKEN&apos;))
                    </code>
                    <Button size="icon" onClick={() => copyText("copy(localStorage.getItem('MEIS_EDU_TOKEN'))", 'console')} className="absolute top-1.5 right-1.5 shadow-none active:translate-y-0" title="Kopiraj komandu" aria-label="Kopiraj komandu">
                      {copied === 'console' ? <Check strokeWidth={2.6} /> : <ClipboardCopy strokeWidth={2.4} />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-secondary-light-border bg-secondary-light text-[11px] font-extrabold text-secondary">5</span>
                <p className="text-[15px] font-extrabold text-heading">Zalijepi token ispod i klikni &quot;Poveži&quot;</p>
              </div>
            </div>
          )}
        </Card>
      {/* Token input */}
      <Card>
        <div>
          <Label htmlFor="ednevnik-token">
            eDnevnik Token
          </Label>
          <Input
            id="ednevnik-token"
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Zalijepi token ovdje..."
            onKeyDown={(e) => { if (e.key === 'Enter') handleConnect() }}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border-2 border-[#FFB3B5] bg-[#FFDFE0] p-3 text-[13px] font-bold text-[#EA2B2B]">
            <AlertCircle className="mt-0.5 size-4 flex-shrink-0" strokeWidth={2.6} />
            <span>{error}</span>
          </div>
        )}

        <Button
          onClick={handleConnect}
          disabled={loading || !tokenInput.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              Povezivanje...
            </>
          ) : (
            'Poveži eDnevnik'
          )}
        </Button>
      </Card>
        </>
      )}

    </div>
  )
}
