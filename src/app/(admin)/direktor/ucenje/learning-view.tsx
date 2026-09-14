'use client'

import Link from 'next/link'
import { AlertTriangle, Search, Sparkles } from 'lucide-react'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { DirektorStats } from '@/lib/direktor-types'
import { KpiTile, Metric, SectionTitle } from '../../nastavnik/_components/widgets'
import { fmtNum, fmtPct, fmtSecs } from '../_lib/direktor-client'
import { Bars } from '../_components/blocks'

const lectureHref = (subject: string, id: string) => `/lectures/${encodeURIComponent(subject)}/${id}`

/** The Učenje screen — shared by the school-wide page and the per-subject page. */
export function LearningView({ s, subject }: { s: DirektorStats; subject?: string }) {
  const L = s.learning
  const funnel = [
    ['Otvoreno', L.funnel.opened],
    ['Pročitano', L.funnel.read],
    ['Kviz započet', L.funnel.quiz_started],
    ['Kviz završen', L.funnel.quiz_finished],
  ] as const
  const subjects = [...L.subjects].sort((a, b) => (a.avg_score ?? 101) - (b.avg_score ?? 101))
  const hist = L.score_hist.bins.map((n, i) => ({ bin: `${i * 10}`, n, low: i < 5 }))

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <KpiTile label="Pročitane lekcije" value={fmtNum(L.kpi.reads.value, 0)} kpi={L.kpi.reads} color="#58CC02" info="Lekcije označene kao pročitane u periodu." />
        <KpiTile label="Završeni kvizovi" value={fmtNum(L.kpi.quizzes.value, 0)} kpi={L.kpi.quizzes} info="Kvizovi dovedeni do rezultata." />
        <KpiTile label="Prosječan rezultat" value={fmtPct(L.kpi.avg_score.value, 0)} kpi={L.kpi.avg_score} color="#FFC800" info="Prosjek svih završenih kvizova." />
        <KpiTile label="Kviz sedmično" value={fmtPct(L.kpi.weekly_quiz_pct.value, 0)} kpi={L.kpi.weekly_quiz_pct} color="#CE82FF" info="Udio aktivnih učenika sa bar jednim kvizom sedmično." />
        <KpiTile label="Vrijeme na lekciji" value={fmtSecs(L.kpi.avg_lecture_time_s.value)} kpi={L.kpi.avg_lecture_time_s} color="#FF9600" info="Prosječno vrijeme čitanja jedne lekcije." />
        <KpiTile label="Serije ≥ 7 dana" value={fmtNum(L.kpi.streaks_7.value, 0)} kpi={L.kpi.streaks_7} color="#FF4B4B" info="Učenici sa 7 i više uzastopnih dana učenja." />
      </div>

      <section className="space-y-2.5">
        <SectionTitle info="Koliko učenika prođe od otvaranja lekcije do završenog kviza.">Lijevak učenja</SectionTitle>
        <Card>
          <Bars rows={funnel.map(([label, v]) => ({ label, value: v }))} max={Math.max(1, L.funnel.opened)} color="#58CC02" format={(v) => `${fmtNum(v, 0)} · ${L.funnel.opened ? fmtPct(((v ?? 0) / L.funnel.opened) * 100, 0) : '—'}`} />
        </Card>
      </section>

      {!subject && (
        <section className="space-y-2.5">
          <SectionTitle info="Prosjek kviza po predmetu, problematični na vrhu. Tap otvara predmet.">Prosjek po predmetu</SectionTitle>
          <Card>
            {subjects.length === 0 ? <p className="text-[13px] font-bold text-muted-foreground">Nema podataka.</p> : (
              <Bars rows={subjects.map((x) => ({ label: x.subject, value: x.avg_score, href: `/direktor/ucenje/${encodeURIComponent(x.subject)}`, sub: x.k_hidden ? 'premalo podataka' : `med ${fmtNum(x.median_score, 0)} · p25 ${fmtNum(x.p25_score, 0)}` }))} max={100} color="#FFC800" format={(v) => fmtPct(v, 0)} />
            )}
          </Card>
        </section>
      )}

      <section className="space-y-2.5">
        <SectionTitle info="Koliko kvizova je završeno sa kojim rezultatom; ispod 50% crveno.">Raspodjela rezultata</SectionTitle>
        <Card className="gap-2">
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                <XAxis dataKey="bin" tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="n" name="Kvizova" radius={[6, 6, 0, 0]} isAnimationActive={false} fill="#1CB0F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Metric label="Ispod 50%" value={fmtPct(L.score_hist.below_50_pct, 0)} tone={(L.score_hist.below_50_pct ?? 0) > 30 ? 'bad' : 'muted'} />
        </Card>
      </section>

      <section className="space-y-2.5">
        <SectionTitle info="Lekcije sa prosjekom ispod 60% ili napuštanjem preko 40% (najmanje 10 pokušaja).">Teme u riziku</SectionTitle>
        {L.risk_topics.length === 0 ? <Card><p className="text-[13px] font-bold text-muted-foreground">Nema tema u riziku.</p></Card> : L.risk_topics.slice(0, 8).map((t) => (
          <Link key={t.lecture_id} href={lectureHref(t.subject, t.lecture_id)} className="block">
            <Card size="sm" className="flex-row items-center gap-3 transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none">
              <span className="w-11 h-11 rounded-full bg-[#FFDFE0] text-[#EA2B2B] flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5" strokeWidth={2.6} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold text-heading truncate">{t.title}</span>
                <span className="block text-[13px] font-bold text-muted-foreground">{t.subject} · {t.class_number}. r. · {t.attempts} pokušaja{t.abandon_rate !== null ? ` · napušteno ${fmtPct(t.abandon_rate, 0)}` : ''}</span>
              </span>
              <Badge variant={(t.avg_score ?? 100) < 50 ? 'destructive' : 'gold'}>{fmtPct(t.avg_score, 0)}</Badge>
            </Card>
          </Link>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-2.5">
        <Card className="gap-2">
          <SectionTitle>Najčitanije</SectionTitle>
          {L.top_read.slice(0, 5).map((t, i) => (
            <Link key={t.lecture_id} href={lectureHref(t.subject, t.lecture_id)} className="flex items-center gap-2 min-h-11 text-[13px] font-bold">
              <span className="w-6 text-muted-foreground tabular-nums">{i + 1}.</span>
              <span className="min-w-0 flex-1 truncate text-heading font-extrabold">{t.title}</span>
              <span className="tabular-nums text-muted-foreground">{fmtNum(t.reads, 0)}</span>
            </Link>
          ))}
        </Card>
        <Card className="gap-2">
          <SectionTitle>Najmanje čitane</SectionTitle>
          {L.least_read.slice(0, 5).map((t, i) => (
            <Link key={t.lecture_id} href={lectureHref(t.subject, t.lecture_id)} className="flex items-center gap-2 min-h-11 text-[13px] font-bold">
              <span className="w-6 text-muted-foreground tabular-nums">{i + 1}.</span>
              <span className="min-w-0 flex-1 truncate text-heading font-extrabold">{t.title}</span>
              <span className="tabular-nums text-muted-foreground">{fmtNum(t.reads, 0)}</span>
            </Link>
          ))}
        </Card>
      </div>

      <section className="space-y-2.5">
        <SectionTitle info="Koliko lekcija postoji po predmetu i razredu i koliko ih je bar jednom pročitano.">Pokrivenost programa</SectionTitle>
        <Card className="gap-2">
          {L.coverage.filter((c) => !subject || c.subject === subject).slice(0, 24).map((c) => (
            <div key={c.subject + c.class_number} className="flex items-center gap-2 text-[13px] font-bold min-h-9">
              <span className="w-28 truncate text-heading font-extrabold">{c.subject} {c.class_number}.</span>
              <div className="flex-1 h-3 rounded-full bg-border overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${c.pct ?? 0}%` }} /></div>
              <span className="w-16 text-right tabular-nums text-muted-foreground">{c.lectures_read}/{c.lectures_total}</span>
            </div>
          ))}
          {L.subjects_without_lectures.length > 0 && <p className="text-[13px] font-bold text-[#EA2B2B]">Bez lekcija: {L.subjects_without_lectures.join(', ')}</p>}
        </Card>
      </section>

      {L.gaps.length > 0 && (
        <section className="space-y-2.5">
          <SectionTitle info="Šta učenici traže, a ne nalaze.">Praznine u sadržaju</SectionTitle>
          <Card className="gap-2">
            {L.gaps.slice(0, 6).map((g) => (
              <div key={g.query} className="flex items-center gap-2 min-h-11">
                <Search className="w-4 h-4 text-disabled flex-shrink-0" strokeWidth={2.6} />
                <span className="min-w-0 flex-1 text-[15px] font-extrabold text-heading truncate">{g.query}</span>
                <span className="text-[13px] font-bold text-muted-foreground tabular-nums">{g.searches}×</span>
                <Link href={`/lectures/nova?topic=${encodeURIComponent(g.query)}`}><Button size="sm" variant="outline"><Sparkles className="w-4 h-4" strokeWidth={2.6} /> Napravi</Button></Link>
              </div>
            ))}
          </Card>
        </section>
      )}

      <section className="space-y-2.5">
        <SectionTitle info="Čitanja, kvizovi i prosjek po sedmicama.">Trend po sedmicama</SectionTitle>
        <Card>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={L.weekly.map((w) => ({ w: w.week_start.slice(5), reads: w.reads, quizzes: w.quizzes, avg: w.avg_score }))} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                <XAxis dataKey="w" tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} minTickGap={20} />
                <YAxis tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="reads" name="Čitanja" stroke="#58CC02" strokeWidth={3} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="quizzes" name="Kvizovi" stroke="#1CB0F6" strokeWidth={3} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="avg" name="Prosjek %" stroke="#FFC800" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="space-y-2.5">
        <SectionTitle info="Koliko učenika koristi kartice i kako im ide na kvizu poslije.">Kartice vs kviz</SectionTitle>
        <Card className="gap-2">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Metric label="Koriste kartice" value={fmtPct(L.flashcards.share_pct, 0)} />
            <Metric label="Kviz poslije kartica" value={fmtPct(L.flashcards.quiz_avg_after_cards, 0)} tone="good" />
            <Metric label="Kviz bez kartica" value={fmtPct(L.flashcards.quiz_avg_without_cards, 0)} />
          </div>
        </Card>
      </section>
    </>
  )
}
