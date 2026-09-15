'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2, MessageSquareWarning, Plus, ThumbsUp, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { haptic } from '@/lib/haptics'
import type { NoteKind, SchoolNote } from '@/lib/skola-types'
import { Chip, EmptyState, SectionTitle } from '../../nastavnik/_components/widgets'
import { ApiError, apiPost, fmtDate, invalidate } from '../../direktor/_lib/direktor-client'
import { usePanel } from '../../_shared/panel-shell'
import { SkolaPage, useSkolaStats } from '../_lib/skola-client'

const KIND_LABEL: Record<NoteKind, string> = { pohvala: 'Pohvala', opomena: 'Opomena', napomena: 'Napomena' }
const KIND_VARIANT = { pohvala: 'secondary', opomena: 'destructive', napomena: 'gold' } as const
const WRITE_ROLES = ['direktor', 'pedagog', 'razredni', 'teacher', 'admin', 'creator']

const FIELD = 'w-full h-12 rounded-xl border-2 border-border bg-background px-3 text-[15px] font-bold text-foreground focus:outline-none focus:border-[#84D8FF]'

function NoteForm({ initialClass, initialSection, onSaved }: { initialClass: number | null; initialSection: number | null; onSaved: () => void }) {
  const [open, setOpen] = useState(!!(initialClass && initialSection))
  const [cls, setCls] = useState<number>(initialClass ?? 1)
  const [sec, setSec] = useState<number>(initialSection ?? 1)
  const [kind, setKind] = useState<NoteKind>('napomena')
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function submit() {
    if (text.trim().length < 3) return
    setBusy(true)
    setMsg(null)
    haptic()
    try {
      await apiPost('/api/skola/notes', { class: cls, section: sec, kind, text: text.trim(), student_name: name.trim() || undefined })
      setText('')
      setName('')
      setMsg('Sačuvano.')
      invalidate('/api/skola/stats')
      onSaved()
    } catch (e) {
      setMsg(e instanceof ApiError && e.status === 403 ? 'Nemaš pravo upisa za ovo odjeljenje.' : e instanceof Error ? e.message : 'Nije uspjelo')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <Button className="w-full h-14" onClick={() => setOpen(true)}>
        <Plus className="w-5 h-5" strokeWidth={2.8} /> Nova zabilješka
      </Button>
    )
  }

  return (
    <Card className="gap-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Razred</span>
          <select className={FIELD} value={cls} onChange={(e) => setCls(Number(e.target.value))}>
            {[1, 2, 3, 4].map((c) => <option key={c} value={c}>{c}.</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Odjeljenje</span>
          <select className={FIELD} value={sec} onChange={(e) => setSec(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <div className="flex gap-1.5">
        {(['pohvala', 'opomena', 'napomena'] as NoteKind[]).map((k) => (
          <Chip key={k} active={kind === k} onClick={() => setKind(k)}>{KIND_LABEL[k]}</Chip>
        ))}
      </div>
      <input className={FIELD} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Učenik (nije obavezno, npr. Marko P.)" />
      <textarea
        className="w-full min-h-[96px] rounded-xl border-2 border-border bg-background px-3 py-2 text-[15px] font-bold text-foreground focus:outline-none focus:border-[#84D8FF]"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={1000}
        placeholder="Šta se desilo — kratko i konkretno."
      />
      <div className="flex gap-2">
        <Button variant="outline" className="h-12" onClick={() => setOpen(false)}>Odustani</Button>
        <Button className="h-12 flex-1" onClick={submit} disabled={busy || text.trim().length < 3}>
          {busy ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.6} /> : <Plus className="w-5 h-5" strokeWidth={2.8} />} Sačuvaj
        </Button>
      </div>
      {msg && <p className="text-[13px] font-bold text-muted-foreground">{msg}</p>}
    </Card>
  )
}

function NoteRow({ n, canDelete, onDeleted }: { n: SchoolNote; canDelete: boolean; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false)
  async function remove() {
    if (!confirm('Obrisati zabilješku?')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/skola/notes?id=${n.id}`, { method: 'DELETE', credentials: 'same-origin' })
      if (!res.ok) throw new Error('Brisanje nije uspjelo')
      invalidate('/api/skola/stats')
      onDeleted()
    } catch {
      setBusy(false)
    }
  }
  return (
    <Card size="sm" className="gap-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={KIND_VARIANT[n.kind]}>{KIND_LABEL[n.kind]}</Badge>
        <Link href={`/skola/odjeljenja/${n.class_number}-${n.section_number}`} className="text-[13px] font-extrabold text-secondary">{n.class_number}-{n.section_number}</Link>
        {n.student_name && <span className="text-[13px] font-extrabold text-heading">{n.student_name}</span>}
        <span className="text-[12px] font-bold text-muted-foreground ml-auto">{fmtDate(n.created_at)}</span>
      </div>
      <p className="text-[14px] leading-[1.45] font-bold text-foreground">{n.text}</p>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{n.author_name ?? '—'}</span>
        {canDelete && (
          <button type="button" onClick={remove} disabled={busy} aria-label="Obriši" className="w-11 h-11 -mr-2 flex items-center justify-center text-muted-foreground active:text-[#FF4B4B]">
            <Trash2 className="w-4 h-4" strokeWidth={2.6} />
          </button>
        )}
      </div>
    </Card>
  )
}

function PonasanjeInner() {
  const sp = useSearchParams()
  const initialClass = Number(sp.get('class')) || null
  const initialSection = Number(sp.get('section')) || null
  const { role } = usePanel()
  const [filter, setFilter] = useState<NoteKind | 'all'>('all')
  const { refetch } = useSkolaStats()
  const canWrite = WRITE_ROLES.includes(role)
  const canDelete = ['direktor', 'admin', 'creator'].includes(role)

  return (
    <SkolaPage>
      {(s) => {
        const N = s.notes
        const list = N.latest.filter((n) => filter === 'all' || n.kind === filter)
        const bySection = [...N.by_section].sort((a, b) => b.opomena - a.opomena).slice(0, 6)
        return (
          <>
            {canWrite && <NoteForm initialClass={initialClass} initialSection={initialSection} onSaved={() => void refetch()} />}

            <div className="grid grid-cols-3 gap-2.5">
              {(['pohvala', 'opomena', 'napomena'] as NoteKind[]).map((k) => (
                <Card key={k} className="gap-1 p-3 items-center text-center">
                  <span className="text-[26px] leading-none font-extrabold tabular-nums text-heading">{N.by_kind[k] ?? 0}</span>
                  <Badge variant={KIND_VARIANT[k]}>{KIND_LABEL[k]}</Badge>
                </Card>
              ))}
            </div>

            {bySection.length > 0 && (
              <section className="space-y-2.5">
                <SectionTitle info="Odjeljenja sa najviše opomena u periodu.">Po odjeljenjima</SectionTitle>
                <Card className="gap-2">
                  {bySection.map((b) => (
                    <Link key={`${b.class_number}-${b.section_number}`} href={`/skola/odjeljenja/${b.class_number}-${b.section_number}`} className="flex items-center gap-2 min-h-10 text-[13px] font-bold">
                      <span className="w-10 font-extrabold text-heading">{b.class_number}-{b.section_number}</span>
                      <span className="flex-1 flex gap-1 flex-wrap">
                        {b.opomena > 0 && <Badge variant="destructive">{b.opomena} opomena</Badge>}
                        {b.pohvala > 0 && <Badge variant="secondary">{b.pohvala} pohvala</Badge>}
                        {b.napomena > 0 && <Badge variant="gold">{b.napomena} napomena</Badge>}
                      </span>
                    </Link>
                  ))}
                </Card>
              </section>
            )}

            <section className="space-y-2.5">
              <SectionTitle>Zabilješke</SectionTitle>
              <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {([['all', 'Sve'], ['opomena', 'Opomene'], ['pohvala', 'Pohvale'], ['napomena', 'Napomene']] as const).map(([k, l]) => (
                  <Chip key={k} active={filter === k} onClick={() => setFilter(k)} className="flex-shrink-0">{l}</Chip>
                ))}
              </div>
              {list.length === 0 ? (
                <EmptyState icon={filter === 'pohvala' ? ThumbsUp : MessageSquareWarning} title="Nema zabilješki" text="Razredne starješine i pedagog ovdje bilježe pohvale, opomene i napomene." />
              ) : (
                <div className="space-y-2">
                  {list.map((n) => <NoteRow key={n.id} n={n} canDelete={canDelete} onDeleted={() => void refetch()} />)}
                </div>
              )}
            </section>
          </>
        )
      }}
    </SkolaPage>
  )
}

export default function SkolaPonasanje() {
  return (
    <Suspense fallback={null}>
      <PonasanjeInner />
    </Suspense>
  )
}
