'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Check, HelpCircle, Loader2, MessageCircleQuestion, RefreshCw, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { AnalysisJob, AnalysisOutput } from '@/lib/direktor-types'
import { haptic } from '@/lib/haptics'
import { Chip, EmptyState, ErrorCard, RowSkeletons, SectionTitle } from '../../nastavnik/_components/widgets'
import { ApiError, DISCLAIMER_TEXT, apiPost, fmtDateTime, invalidate, useApi, usePeriod } from '../_lib/direktor-client'

const VERDICT: Record<AnalysisOutput['health_verdict'], { label: string; color: string; bg: string }> = {
  dobro: { label: 'Dobro', color: '#3E8A00', bg: '#E6FAD2' },
  pažnja: { label: 'Pažnja', color: '#C79000', bg: '#FFF9E0' },
  problem: { label: 'Problem', color: '#D12F2F', bg: '#FFE5E5' },
}

const WHO: Record<string, string> = { direktor: 'Direktor', razredni: 'Razredni', nastavnik: 'Profesor', pedagog: 'Pedagog' }
const EFFORT: Record<string, string> = { nisko: 'lako', srednje: 'srednje', visoko: 'zahtjevno' }
const KIND: Record<string, string> = { daily: 'Dnevna', weekly: 'Sedmična', adhoc: 'Na zahtjev', question: 'Pitanje' }

const SEVERITY_TONE: Record<string, string> = { critical: '#FF4B4B', warn: '#FFC800', info: '#1CB0F6' }

function isBusy(j: AnalysisJob | null | undefined) {
  return !!j && (j.status === 'pending' || j.status === 'processing')
}

/** One finished analysis: verdict, summary, insights, checklist, anomalies, questions. */
function Report({ job, onToggle }: { job: AnalysisJob; onToggle: (index: number, done: boolean) => void }) {
  const o = job.output
  if (!o) return null
  const v = VERDICT[o.health_verdict] ?? VERDICT['pažnja']
  return (
    <div className="space-y-4">
      <Card className="gap-3 border-[#E1BDFF] bg-[#F9F3FF] shadow-[0_2px_0_#E1BDFF]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center h-8 px-3 rounded-full text-[12px] font-extrabold uppercase tracking-[0.04em]" style={{ background: v.bg, color: v.color }}>{v.label}</span>
          <Badge variant="outline">{KIND[job.kind] ?? job.kind}</Badge>
          <Badge variant="outline">pouzdanost: {o.confidence}</Badge>
          <span className="text-[12px] font-bold text-muted-foreground ml-auto">{fmtDateTime(job.finished_at ?? job.created_at)}</span>
        </div>
        <p className="text-[16px] leading-[1.5] font-bold text-foreground">{o.summary}</p>
        {(o.risk_summary.students_at_risk > 0 || o.risk_summary.classes_to_watch.length > 0 || o.risk_summary.subjects_to_watch.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {o.risk_summary.students_at_risk > 0 && <Badge variant="destructive">{o.risk_summary.students_at_risk} učenika u riziku</Badge>}
            {o.risk_summary.classes_to_watch.map((c) => <Link key={c} href={/^\d+-\d+$/.test(c) ? `/direktor/razredi/${c}` : '/direktor/razredi'}><Badge variant="gold">odj. {c}</Badge></Link>)}
            {o.risk_summary.subjects_to_watch.map((s) => <Link key={s} href={`/direktor/ucenje/${encodeURIComponent(s)}`}><Badge variant="secondary">{s}</Badge></Link>)}
          </div>
        )}
      </Card>

      {o.insights.length > 0 && (
        <section className="space-y-2.5">
          <SectionTitle>Nalazi</SectionTitle>
          <div className="space-y-2">
            {o.insights.map((i, idx) => {
              const body = (
                <div className="flex items-start gap-3">
                  <span className="mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: SEVERITY_TONE[i.severity] ?? '#AFAFAF' }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-extrabold text-heading">{i.title}</span>
                    <span className="block text-[13px] leading-[1.45] font-bold text-muted-foreground mt-0.5">{i.detail}</span>
                    {i.delta && <span className="inline-block mt-1.5 rounded-full bg-muted px-2.5 py-1 text-[12px] font-extrabold text-heading tabular-nums">{i.delta}</span>}
                  </span>
                </div>
              )
              const href = i.link && i.link.startsWith('/') ? i.link : null
              return href ? (
                <Link key={idx} href={href} className="block rounded-2xl border-2 border-border bg-card px-3 py-3 shadow-[0_2px_0_var(--color-border)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none">{body}</Link>
              ) : (
                <div key={idx} className="rounded-2xl border-2 border-border bg-card px-3 py-3 shadow-[0_2px_0_var(--color-border)]">{body}</div>
              )
            })}
          </div>
        </section>
      )}

      {o.recommendations.length > 0 && (
        <section className="space-y-2.5">
          <SectionTitle info="Dodirni kružić kad je preporuka sprovedena — ostaje zabilježeno ko i kada.">Šta uraditi · {job.actions_done.length}/{o.recommendations.length}</SectionTitle>
          <div className="space-y-2">
            {o.recommendations.map((r, idx) => {
              const done = job.actions_done.includes(idx)
              return (
                <div key={idx} className={`flex items-start gap-3 rounded-2xl border-2 px-3 py-3 shadow-[0_2px_0_var(--color-border)] ${done ? 'border-[#B8F28B] bg-[#F1FBE8]' : 'border-border bg-card'}`}>
                  <button
                    type="button"
                    aria-pressed={done}
                    aria-label={done ? 'Označi kao neurađeno' : 'Označi kao urađeno'}
                    onClick={() => onToggle(idx, !done)}
                    className={`mt-0.5 w-11 h-11 rounded-full border-[3px] flex items-center justify-center flex-shrink-0 transition-[transform,background-color] duration-[80ms] active:scale-90 ${done ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-background text-transparent'}`}
                  >
                    <Check className="w-6 h-6" strokeWidth={3.2} />
                  </button>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[15px] leading-[1.35] font-extrabold ${done ? 'text-muted-foreground line-through' : 'text-heading'}`}>{r.action}</span>
                    <span className="block text-[13px] leading-[1.45] font-bold text-muted-foreground mt-0.5">{r.why}</span>
                    <span className="flex flex-wrap gap-1.5 mt-1.5">
                      <Badge variant="outline">{WHO[r.who] ?? r.who}</Badge>
                      <Badge variant="outline">{EFFORT[r.effort] ?? r.effort}</Badge>
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {o.anomalies.length > 0 && (
        <section className="space-y-2.5">
          <SectionTitle>Neobično</SectionTitle>
          <Card className="gap-3">
            {o.anomalies.map((a, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-[#C79000] flex-shrink-0 mt-0.5" strokeWidth={2.6} />
                <span className="min-w-0">
                  <span className="block text-[14px] font-extrabold text-heading">{a.what}<span className="text-muted-foreground font-bold"> · {a.when}</span></span>
                  <span className="block text-[13px] font-bold text-muted-foreground">Mogući uzrok: {a.possible_cause}</span>
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}

      {o.questions_for_staff.length > 0 && (
        <section className="space-y-2.5">
          <SectionTitle info="Pitanja koja vrijedi postaviti na sjednici ili razrednim starješinama.">Pitanja za kolektiv</SectionTitle>
          <Card className="gap-2">
            {o.questions_for_staff.map((q, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[14px] leading-[1.45] font-bold text-foreground">
                <HelpCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" strokeWidth={2.6} />
                <span>{q}</span>
              </div>
            ))}
          </Card>
        </section>
      )}

      {o.data_caveats.length > 0 && (
        <p className="text-[12px] leading-[1.45] font-bold text-muted-foreground">{o.data_caveats.join(' · ')}</p>
      )}
      <p className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{DISCLAIMER_TEXT}{job.model ? ` · ${job.model}` : ''}</p>
    </div>
  )
}

export default function DirektorAi() {
  const { period } = usePeriod()
  const reports = useApi<{ jobs: AnalysisJob[] }>('/api/direktor/analysis')
  const questions = useApi<{ jobs: AnalysisJob[] }>('/api/direktor/analysis?kind=question')
  const [selected, setSelected] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const jobs = reports.data?.jobs ?? []
  const current = jobs.find((j) => j.id === selected) ?? jobs.find((j) => j.status === 'done') ?? jobs[0] ?? null
  const qJobs = questions.data?.jobs ?? []
  const anyBusy = jobs.some(isBusy) || qJobs.some(isBusy)

  // The worker writes `output` asynchronously — poll while anything is queued.
  useEffect(() => {
    if (!anyBusy) {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
      return
    }
    pollRef.current = setInterval(() => {
      void reports.refetch()
      void questions.refetch()
    }, 4000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyBusy])

  async function startAnalysis() {
    setStarting(true)
    setNotice(null)
    haptic()
    try {
      const { data } = await apiPost<{ job: AnalysisJob; cached?: boolean }>('/api/direktor/analysis', { kind: 'adhoc', period })
      invalidate('/api/direktor/analysis')
      await reports.refetch()
      setSelected(data.job.id)
      if (data.cached && data.job.status === 'done') setNotice('Prikazana je analiza od malopre — nova se pravi najviše jednom na sat.')
    } catch (e) {
      setNotice(e instanceof ApiError && e.status === 429 ? 'Dnevni limit od 5 analiza je iskorišćen. Sjutra opet.' : e instanceof Error ? e.message : 'Nije uspjelo')
    } finally {
      setStarting(false)
    }
  }

  async function ask() {
    const q = question.trim()
    if (q.length < 3) return
    setAsking(true)
    setNotice(null)
    haptic()
    try {
      await apiPost('/api/direktor/analysis', { kind: 'question', question: q, period })
      invalidate('/api/direktor/analysis')
      setQuestion('')
      await questions.refetch()
    } catch (e) {
      setNotice(e instanceof ApiError && e.status === 429 ? 'Dnevni limit od 5 analiza je iskorišćen. Sjutra opet.' : e instanceof Error ? e.message : 'Nije uspjelo')
    } finally {
      setAsking(false)
    }
  }

  async function toggleAction(index: number, done: boolean) {
    if (!current) return
    haptic()
    try {
      await apiPost('/api/direktor/actions', { job_id: current.id, index, done })
      invalidate('/api/direktor/analysis')
      await reports.refetch()
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Nije uspjelo')
    }
  }

  if (reports.error && !reports.data) return <ErrorCard message={reports.error.message} onRetry={() => void reports.refetch()} />

  return (
    <div className="space-y-5">
      <Card className="gap-3">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-[#F3E3FF] text-accent-dark flex items-center justify-center flex-shrink-0"><Sparkles className="w-5 h-5" strokeWidth={2.6} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[17px] leading-[1.25] font-extrabold text-heading">AI čita samo brojke</p>
            <p className="text-[13px] font-bold text-muted-foreground">Bez imena učenika. Najviše 5 analiza dnevno.</p>
          </div>
        </div>
        <Button className="w-full h-14" onClick={startAnalysis} disabled={starting || anyBusy}>
          {starting || jobs.some(isBusy) ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.6} /> : <RefreshCw className="w-5 h-5" strokeWidth={2.6} />}
          {jobs.some(isBusy) ? 'Analiza se piše…' : 'Osvježi analizu'}
        </Button>
        {notice && <p className="text-[13px] font-bold text-[#C79000]">{notice}</p>}
      </Card>

      {jobs.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none]">
          {jobs.slice(0, 8).map((j) => (
            <Chip key={j.id} active={current?.id === j.id} onClick={() => setSelected(j.id)} className="whitespace-nowrap flex-shrink-0">
              {KIND[j.kind] ?? j.kind} · {fmtDateTime(j.created_at)}{isBusy(j) ? ' · …' : ''}
            </Chip>
          ))}
        </div>
      )}

      {reports.loading && !reports.data ? (
        <RowSkeletons n={4} />
      ) : !current ? (
        <EmptyState icon={Sparkles} title="Još nema analize" text="Dodirni „Osvježi analizu” — izvještaj stiže za oko minut." />
      ) : isBusy(current) ? (
        <Card className="gap-2 items-center text-center py-8">
          <Loader2 className="w-8 h-8 text-accent-dark animate-spin" strokeWidth={2.6} />
          <p className="text-[15px] font-extrabold text-heading">AI piše izvještaj</p>
          <p className="text-[13px] font-bold text-muted-foreground">Obično traje do minut. Stranica se sama osvježava.</p>
        </Card>
      ) : current.status === 'error' ? (
        <ErrorCard message={current.error ?? 'Analiza nije uspjela'} onRetry={startAnalysis} />
      ) : (
        <Report job={current} onToggle={toggleAction} />
      )}

      <section className="space-y-2.5">
        <SectionTitle info="Postavi pitanje običnim jezikom — AI odgovara iz istih agregata, bez imena.">Pitaj podatke</SectionTitle>
        <Card className="gap-3">
          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void ask() }}
              maxLength={300}
              placeholder="Npr. Zašto 7-2 čita manje od ostalih?"
              className="flex-1 min-w-0 h-14 rounded-2xl border-2 border-border bg-background px-4 text-[15px] font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#84D8FF]"
            />
            <Button className="h-14 px-4" onClick={ask} disabled={asking || question.trim().length < 3}>
              {asking ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.6} /> : <MessageCircleQuestion className="w-5 h-5" strokeWidth={2.6} />}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['Koje odjeljenje najviše zaostaje?', 'Koji predmet ima najslabije kvizove?', 'Šta se promijenilo ove sedmice?'].map((q) => (
              <Chip key={q} onClick={() => setQuestion(q)}>{q}</Chip>
            ))}
          </div>
        </Card>
        {qJobs.length > 0 && (
          <div className="space-y-2">
            {qJobs.slice(0, 6).map((j) => (
              <Card key={j.id} size="sm" className="gap-2">
                <p className="text-[14px] font-extrabold text-heading">{j.question}</p>
                {isBusy(j) ? (
                  <p className="flex items-center gap-2 text-[13px] font-bold text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.6} /> AI odgovara…</p>
                ) : j.status === 'error' ? (
                  <p className="text-[13px] font-bold text-destructive">{j.error ?? 'Nije uspjelo'}</p>
                ) : (
                  <>
                    <p className="text-[14px] leading-[1.5] font-bold text-foreground">{j.output?.summary}</p>
                    {j.output && j.output.recommendations.length > 0 && (
                      <ul className="space-y-1">
                        {j.output.recommendations.slice(0, 3).map((r, i) => <li key={i} className="text-[13px] font-bold text-muted-foreground">• {r.action}</li>)}
                      </ul>
                    )}
                  </>
                )}
                <span className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{fmtDateTime(j.created_at)}</span>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
