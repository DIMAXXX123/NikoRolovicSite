'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertCircle, BookOpen, Check, ChevronLeft, Clock, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type Job = {
  id: string
  subject: string
  class_number: number
  topic: string | null
  status: 'pending' | 'processing' | 'done' | 'error'
  progress: string | null
  error: string | null
  lecture_id: string | null
  created_at: string
}

/** Live status of one generation job — realtime with a polling fallback. */
export default function NovaLekcijaStatusPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = useMemo(() => createClient(), [])
  const [job, setJob] = useState<Job | null>(null)
  const [missing, setMissing] = useState(false)
  const [waitedLong, setWaitedLong] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase.from('lecture_jobs').select('id, subject, class_number, topic, status, progress, error, lecture_id, created_at').eq('id', id).maybeSingle()
      if (cancelled) return
      if (!data) setMissing(true)
      else setJob(data as Job)
    }
    load()
    const channel = supabase
      .channel(`lecture-job-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lecture_jobs', filter: `id=eq.${id}` }, (payload: { new: Job }) => {
        setJob(payload.new as Job)
      })
      .subscribe()
    const poll = setInterval(load, 6000)
    return () => {
      cancelled = true
      clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [id, supabase])

  useEffect(() => {
    if (!job || job.status === 'done' || job.status === 'error') return
    const t = setTimeout(() => setWaitedLong(true), 90000)
    return () => clearTimeout(t)
  }, [job])

  const steps = [
    { key: 'pending', label: 'U redu za obradu' },
    { key: 'processing', label: job?.progress || 'Generiše se…' },
    { key: 'done', label: 'Lekcija je spremna' },
  ]
  const stepIndex = job ? ({ pending: 0, processing: 1, done: 2, error: 1 } as const)[job.status] : 0

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      <Link
        href="/lectures"
        className="inline-flex items-center gap-1 h-11 text-[13px] font-extrabold uppercase tracking-[0.04em] text-secondary w-fit hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-lg"
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={2.6} /> Lekcije
      </Link>

      <div>
        <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary-text" strokeWidth={2.6} /> Nova lekcija
        </h1>
        {job && (
          <p className="text-[13px] font-bold text-muted-foreground mt-1">
            {job.subject} · {job.class_number}. razred{job.topic ? ` · ${job.topic}` : ''}
          </p>
        )}
      </div>

      {missing && (
        <Card className="text-center py-10">
          <p className="text-[17px] font-extrabold text-foreground">Zadatak nije pronađen</p>
        </Card>
      )}

      {job && job.status !== 'error' && (
        <Card className="space-y-4">
          {steps.map((s, i) => {
            const done = i < stepIndex || job.status === 'done'
            const active = i === stepIndex && job.status !== 'done'
            return (
              <div key={s.key} className="flex items-center gap-3 min-h-11">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                    done ? 'bg-primary-light border-primary-light-border text-primary-text' : active ? 'bg-secondary-light border-secondary-light-border text-secondary' : 'bg-muted border-border text-disabled'
                  }`}
                >
                  {done ? <Check className="w-5 h-5" strokeWidth={2.8} /> : active ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.6} /> : <Clock className="w-5 h-5" strokeWidth={2.4} />}
                </div>
                <p className={`text-[15px] font-extrabold ${done || active ? 'text-heading' : 'text-disabled'}`}>{s.label}</p>
              </div>
            )
          })}
        </Card>
      )}

      {job?.status === 'done' && job.lecture_id && (
        <Button className="w-full" size="lg" onClick={() => (window.location.href = `/lectures/${encodeURIComponent(job.subject)}/${job.lecture_id}`)}>
          <BookOpen className="w-5 h-5" strokeWidth={2.6} /> Otvori lekciju
        </Button>
      )}

      {job?.status === 'error' && (
        <Card className="space-y-3 border-[#FFB3B5] bg-[#FFDFE0]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-[#EA2B2B] flex-shrink-0" strokeWidth={2.6} />
            <div>
              <p className="text-[15px] font-extrabold text-[#EA2B2B]">Generisanje nije uspjelo</p>
              <p className="text-[13px] font-bold text-[#7A1F24] mt-1 break-words">{job.error || 'Nepoznata greška'}</p>
            </div>
          </div>
          <Link href={`/lectures/nova?subject=${encodeURIComponent(job.subject)}`} className="block">
            <Button variant="outline" className="w-full">Pokušaj ponovo</Button>
          </Link>
        </Card>
      )}

      {job && (job.status === 'pending' || job.status === 'processing') && (
        <p className="text-center text-[13px] font-bold text-muted-foreground">
          {waitedLong ? 'Traje duže nego obično — generator možda trenutno nije uključen. Zadatak ostaje u redu i biće obrađen čim se uključi.' : 'Generisanje traje 1–3 minuta. Možeš zatvoriti stranicu — lekcija će se pojaviti u predmetu.'}
        </p>
      )}
    </div>
  )
}
