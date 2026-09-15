'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState, SectionTitle } from '../../nastavnik/_components/widgets'
import { fmtNum, fmtPct, scoreColor } from '../../direktor/_lib/direktor-client'
import { SkolaPage } from '../_lib/skola-client'

const lectureHref = (subject: string, id: string) => `/lectures/${encodeURIComponent(subject)}/${id}`

/** Quiz results and weak topics — what the app itself measures about learning. */
export default function SkolaUcenje() {
  return (
    <SkolaPage>
      {(s) => {
        const Q = s.quizzes
        const subjects = [...Q.by_subject].sort((a, b) => (a.avg_score ?? 101) - (b.avg_score ?? 101))
        const hist = Q.score_hist.bins.map((n, i) => ({ bin: `${i * 10}`, n, low: i < 5 }))
        const periodLabel = Q.period === '7d' ? 'zadnjih 7 dana' : Q.period === '30d' ? 'zadnjih 30 dana' : 'ovo polugodište'

        return (
          <>
            <Card className="gap-1 border-[#84D8FF] bg-[#EEF9FF] shadow-[0_2px_0_#84D8FF]">
              <p className="text-[15px] font-extrabold text-heading">Kvizovi iz aplikacije · {periodLabel}</p>
              <p className="text-[13px] font-bold text-muted-foreground">Nisu ocjene iz dnevnika — pokazuju koliko učenici razumiju lekcije. Rezultat je u procentima.</p>
            </Card>

            <section className="space-y-2.5">
              <SectionTitle info="Prosječan rezultat kviza po predmetu, od najslabijeg.">Rezultati kvizova po predmetima</SectionTitle>
              {subjects.length === 0 ? (
                <Card><p className="text-[13px] font-bold text-muted-foreground">Nema završenih kvizova u periodu.</p></Card>
              ) : (
                <Card className="gap-3">
                  {subjects.map((sub) => (
                    <div key={sub.subject} className="min-h-11">
                      <div className="flex items-center justify-between gap-2 text-[13px] font-extrabold">
                        <span className="truncate text-heading">{sub.subject}<span className="text-muted-foreground font-bold"> · {fmtNum(sub.quiz_finishes ?? 0, 0)} kvizova</span></span>
                        <span className="tabular-nums" style={{ color: scoreColor(sub.avg_score) }}>{sub.k_hidden ? 'premalo' : fmtPct(sub.avg_score, 0)}</span>
                      </div>
                      <div className="h-3 rounded-full bg-border overflow-hidden mt-1">
                        <div className="h-full rounded-full" style={{ width: `${sub.avg_score ?? 0}%`, background: scoreColor(sub.avg_score) }} />
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </section>

            {Q.score_hist.total > 0 && (
              <section className="space-y-2.5">
                <SectionTitle info="Koliko kvizova je završeno sa kojim rezultatom. Crveno = ispod 50 %.">Raspodjela rezultata</SectionTitle>
                <Card>
                  <div className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hist} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                        <XAxis dataKey="bin" tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="n" name="Kvizova" radius={[6, 6, 0, 0]} isAnimationActive={false} fill="#1CB0F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[13px] font-bold text-muted-foreground">Ispod 50 %: {fmtPct(Q.score_hist.below_50_pct, 0)} od {fmtNum(Q.score_hist.total, 0)} kvizova</p>
                </Card>
              </section>
            )}

            <section className="space-y-2.5">
              <SectionTitle info="Lekcije gdje kviz provaljuju ili napuštaju — signal profesoru da temu objasni drugačije.">Slabe teme</SectionTitle>
              {Q.risk_topics.length === 0 ? (
                <EmptyState icon={AlertTriangle} title="Nema slabih tema" text="Nijedna lekcija sa 10+ pokušaja nije ispod 60 % niti se masovno napušta." />
              ) : (
                <div className="space-y-2">
                  {Q.risk_topics.map((t) => (
                    <Link key={t.lecture_id} href={lectureHref(t.subject, t.lecture_id)} className="flex items-center gap-3 min-h-14 rounded-2xl border-2 border-[#FFE28A] bg-[#FFF9E0] px-3 py-2 shadow-[0_2px_0_#FFE28A] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none">
                      <AlertTriangle className="w-5 h-5 text-[#C79000] flex-shrink-0" strokeWidth={2.6} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-extrabold text-heading truncate">{t.title}</span>
                        <span className="block text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{t.subject} · {t.class_number}. razred · {t.attempts} pokušaja · napušteno {fmtPct(t.abandon_rate, 0)}</span>
                      </span>
                      <Badge variant={(t.avg_score ?? 100) < 50 ? 'destructive' : 'gold'}>{fmtPct(t.avg_score, 0)}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )
      }}
    </SkolaPage>
  )
}
