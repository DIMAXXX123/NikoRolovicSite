'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ClipboardPaste, Link2, Loader2, Smartphone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { haptic } from '@/lib/haptics'
import { Chip, SectionTitle } from '../../nastavnik/_components/widgets'
import { ApiError, apiPost, fmtDateTime, fmtNum, invalidate } from '../../direktor/_lib/direktor-client'
import { usePanel } from '../../_shared/panel-shell'
import { useSkolaStats } from '../_lib/skola-client'

const WRITE_ROLES = ['direktor', 'pedagog', 'razredni', 'teacher', 'admin', 'creator']

const EXAMPLES = {
  grades: `razred;odjeljenje;predmet;ocjena;datum;tip;ucenik
2;3;Matematika;4;12.09.2026;pismeni;Marko P.
2;3;Matematika;2;12.09.2026;pismeni;Ana V.
2;3;Fizika;5;10.09.2026;usmeni;Marko P.`,
  absences: `razred;odjeljenje;datum;sati;opravdano;ucenik
2;3;11.09.2026;6;da;Marko P.
2;3;12.09.2026;2;ne;Ana V.`,
}

/** How marks get into the panel: pupils' eDnevnik, or staff paste. */
export default function SkolaUnos() {
  const { role } = usePanel()
  const { data, refetch } = useSkolaStats()
  const [kind, setKind] = useState<'grades' | 'absences'>('grades')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ inserted: number; skipped: number; errors: { line: number; reason: string }[] } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const canWrite = WRITE_ROLES.includes(role)
  const meta = data?.meta

  async function submit() {
    if (!text.trim()) return
    setBusy(true)
    setErr(null)
    setResult(null)
    haptic()
    try {
      const { data: r } = await apiPost<{ inserted: number; skipped: number; errors: { line: number; reason: string }[] }>('/api/skola/import', { kind, text })
      setResult(r)
      if (r.inserted > 0) {
        setText('')
        invalidate('/api/skola/stats')
        void refetch()
      }
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Nije uspjelo')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card className="gap-3">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-[#F3E3FF] text-accent-dark flex items-center justify-center flex-shrink-0"><Smartphone className="w-5 h-5" strokeWidth={2.6} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold text-heading">Odakle dolaze ocjene</p>
            <p className="text-[13px] font-bold text-muted-foreground">Tri izvora, svi se sabiraju u istu statistiku.</p>
          </div>
        </div>
        <div className="space-y-2 text-[13px] font-bold text-foreground">
          <div className="flex items-start gap-2"><Badge variant="secondary">1</Badge><span><b>eDnevnik učenika.</b> Kad učenik poveže svoj eDnevnik u aplikaciji (Još → eDnevnik), njegove ocjene i izostanci se automatski šalju ovdje — bez imena, samo za prosjeke. Trenutno: <b>{meta ? fmtNum(meta.ednevnik_students, 0) : '…'}</b> učenika{meta?.last_sync_at ? `, zadnji sync ${fmtDateTime(meta.last_sync_at)}` : ''}.</span></div>
          <div className="flex items-start gap-2"><Badge variant="gold">2</Badge><span><b>Ručni unos.</b> Razredni starješina ili pedagog nalijepi redove ispod (iz eDnevnik izvoza ili tabele). Uneseno: <b>{meta ? fmtNum(meta.manual_rows, 0) : '…'}</b> ocjena.</span></div>
          <div className="flex items-start gap-2"><Badge variant="outline">3</Badge><span><b>Pristup škole MEIS‑u.</b> Kad škola dobije pristup, sve ide automatski za sve učenike. Dok toga nema, panel pokazuje demo podatke ({meta ? fmtNum(meta.seed_share, 0) : '…'} % ocjena u periodu).</span></div>
        </div>
        <Link href="/ednevnik" className="inline-flex items-center gap-1 min-h-11 text-[12px] font-extrabold uppercase tracking-[0.04em] text-secondary"><Link2 className="w-4 h-4" strokeWidth={2.6} /> Kako učenik povezuje eDnevnik</Link>
      </Card>

      {canWrite ? (
        <section className="space-y-2.5">
          <SectionTitle info="Jedan red = jedna ocjena ili jedan izostanak. Razdvajaj sa ; , ili tabom. Prvi red sa nazivima kolona je dozvoljen. Datum: 12.09.2026 ili 2026-09-12. Kolona učenik grupiše redove istog učenika (ime ili šifra) — bez nje se svaki red računa kao drugi učenik.">Nalijepi redove</SectionTitle>
          <div className="flex gap-1.5">
            <Chip active={kind === 'grades'} onClick={() => { setKind('grades'); setResult(null) }}>Ocjene</Chip>
            <Chip active={kind === 'absences'} onClick={() => { setKind('absences'); setResult(null) }}>Izostanci</Chip>
          </div>
          <Card className="gap-3">
            <pre className="text-[12px] leading-[1.5] font-bold text-muted-foreground bg-muted rounded-xl px-3 py-2 overflow-x-auto whitespace-pre">{EXAMPLES[kind]}</pre>
            <textarea
              className="w-full min-h-[160px] rounded-xl border-2 border-border bg-background px-3 py-2 text-[13px] font-bold font-mono text-foreground focus:outline-none focus:border-[#84D8FF]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={kind === 'grades' ? 'razred;odjeljenje;predmet;ocjena;datum;tip;ucenik' : 'razred;odjeljenje;datum;sati;opravdano;ucenik'}
              spellCheck={false}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="h-12" onClick={() => setText(EXAMPLES[kind])}>Primjer</Button>
              <Button className="h-12 flex-1" onClick={submit} disabled={busy || !text.trim()}>
                {busy ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.6} /> : <ClipboardPaste className="w-5 h-5" strokeWidth={2.6} />} Uvezi
              </Button>
            </div>
            {err && <p className="text-[13px] font-bold text-[#FF4B4B]">{err}</p>}
            {result && (
              <div className="space-y-1.5">
                <p className="text-[14px] font-extrabold text-heading">Uvezeno {result.inserted} · preskočeno {result.skipped} (duplikati){result.errors.length > 0 ? ` · greške ${result.errors.length}` : ''}</p>
                {result.errors.slice(0, 8).map((e) => (
                  <p key={e.line} className="text-[12px] font-bold text-muted-foreground">red {e.line}: {e.reason}</p>
                ))}
              </div>
            )}
          </Card>
        </section>
      ) : (
        <Card><p className="text-[13px] font-bold text-muted-foreground">Ručni unos je dostupan razrednim starješinama, pedagogu i direktoru.</p></Card>
      )}
    </div>
  )
}
