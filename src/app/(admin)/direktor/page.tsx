'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Info, Send } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { KpiTile, Metric, SectionTitle, SignalList } from '../nastavnik/_components/widgets'
import { fmtNum, fmtPct, fmtSecs } from './_lib/direktor-client'
import { AiCard, HealthRing, HeatmapGrid, StatsPage } from './_components/blocks'
import { apiPost } from './_lib/direktor-client'

export default function DirektorPregled() {
  const [formula, setFormula] = useState(false)
  const [digest, setDigest] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function sendDigest() {
    setSending(true)
    try {
      const { data } = await apiPost<{ text: string; sent: boolean; recipients: number }>('/api/direktor/digest', {})
      setDigest(data.sent ? `Poslato (${data.recipients}).` : data.text)
    } catch (e) {
      setDigest(e instanceof Error ? e.message : 'Slanje nije uspjelo')
    } finally {
      setSending(false)
    }
  }

  return (
    <StatsPage>
      {(s) => {
        const h = s.health
        const activity = s.activity.series.map((p, i) => ({ date: p.date.slice(5), dau: p.dau, prev: s.activity.prev_series[i]?.dau ?? null }))
        return (
          <>
            <AiCard ai={s.ai} />

            <Card className="gap-3">
              <div className="flex items-center gap-4">
                <HealthRing score={h.score === null ? null : Math.round(h.score)} />
                <div className="min-w-0 flex-1">
                  <p className="text-[20px] leading-[1.25] font-extrabold text-heading">Zdravlje škole</p>
                  <p className="text-[13px] font-bold text-muted-foreground">{h.delta === null ? 'bez poređenja' : `${h.delta > 0 ? '+' : ''}${fmtNum(h.delta, 1)} vs prošla sedmica`}</p>
                  <button type="button" onClick={() => setFormula(!formula)} className="mt-1 inline-flex items-center gap-1 min-h-11 text-[12px] font-extrabold uppercase tracking-[0.04em] text-secondary">
                    <Info className="w-4 h-4" strokeWidth={2.6} /> {formula ? 'Sakrij formulu' : 'Kako se računa'}
                  </button>
                </div>
              </div>
              {formula && (
                <div className="grid grid-cols-2 gap-2 text-[13px] font-bold">
                  {Object.entries(h.components ?? {}).map(([k, c]) => (
                    <div key={k} className="rounded-xl bg-muted px-3 py-2">
                      <span className="block text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{k.replace(/_/g, ' ')} · {Math.round(c.weight * 100)}%</span>
                      <span className="text-heading">{fmtNum(c.value, 0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <div className="grid grid-cols-2 gap-2.5">
              <KpiTile label="Aktivni danas" value={fmtNum(s.kpi.active_today.value, 0)} kpi={s.kpi.active_today} info="Učenici sa bar jednom sesijom danas." />
              <KpiTile label="Aktivni 7 dana" value={fmtNum(s.kpi.wau.value, 0)} kpi={s.kpi.wau} color="#58CC02" info="Različiti učenici aktivni u zadnjih 7 dana (WAU)." />
              <KpiTile label="Aktivni 30 dana" value={fmtNum(s.kpi.mau.value, 0)} kpi={s.kpi.mau} color="#CE82FF" info="Različiti učenici aktivni u zadnjih 30 dana (MAU)." />
              <KpiTile label="Pokrivenost" value={fmtPct(s.kpi.coverage_pct.value, 0)} kpi={s.kpi.coverage_pct} color="#FFC800" info={`Registrovano ${s.kpi.registered} od ${s.kpi.verified_total} učenika sa spiska.`} />
              <KpiTile label="Vrijeme po sesiji" value={fmtSecs(s.kpi.avg_session_s.value)} kpi={s.kpi.avg_session_s} color="#FF9600" info="Prosječno trajanje jedne sesije." />
              <KpiTile label="Sesija sedmično" value={fmtNum(s.kpi.sessions_per_student_week.value, 1)} kpi={s.kpi.sessions_per_student_week} info="Prosječan broj sesija po aktivnom učeniku sedmično." />
            </div>

            <section className="space-y-2.5">
              <SectionTitle info="Udio učenika koji se vrate 1., 7. i 30. dan poslije prve sesije (zadnja kohorta).">Zadržavanje</SectionTitle>
              <Card className="gap-3">
                {s.retention.last_cohort ? (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[['D1', s.retention.last_cohort.d1], ['D7', s.retention.last_cohort.d7], ['D30', s.retention.last_cohort.d30]].map(([k, v]) => (
                      <div key={String(k)} className="rounded-xl bg-muted py-3">
                        <span className="block text-[24px] leading-none font-extrabold text-heading tabular-nums">{fmtPct(v as number | null, 0)}</span>
                        <span className="block mt-1 text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{k}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] font-bold text-muted-foreground">Nema kohorti u ovom periodu.</p>
                )}
                {s.retention.cohorts.length > 1 && (
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={s.retention.cohorts.map((c) => ({ w: c.cohort_week.slice(5), d7: c.d7 }))} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                        <XAxis dataKey="w" tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip formatter={(v) => [`${fmtNum(Number(v), 0)}%`, 'D7']} />
                        <Line type="monotone" dataKey="d7" stroke="#CE82FF" strokeWidth={3} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Dnevno aktivni učenici, sa prošlim periodom sivom linijom.">Aktivnost</SectionTitle>
              <Card>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activity} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} minTickGap={24} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="prev" name="Prošli period" stroke="#CECECE" strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="dau" name="Aktivni" stroke="#1CB0F6" strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <Metric label="Sesija ukupno" value={fmtNum(s.activity.totals.sessions, 0)} />
                  <Metric label="Novih učenika" value={fmtNum(s.activity.totals.new_users, 0)} tone="good" />
                  <Metric label="Instalacija" value={fmtNum(s.activity.totals.installs, 0)} />
                </div>
              </Card>
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Broj događaja po danu u sedmici i satu.">Kada uče</SectionTitle>
              <Card><HeatmapGrid heatmap={s.heatmap} /></Card>
            </section>

            <section className="space-y-2.5">
              <SectionTitle>Signali</SectionTitle>
              <SignalList signals={s.signals} />
            </section>

            <section className="space-y-2.5">
              <SectionTitle>Uređaji i instalacije</SectionTitle>
              <Card className="gap-3">
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <Metric label="PWA instalirano" value={fmtPct(s.devices.pwa_share_pct, 0)} />
                  <Metric label="eDnevnik povezan" value={fmtPct(s.devices.ednevnik_pct, 0)} />
                  <Metric label="Sesija" value={fmtNum(s.devices.sessions, 0)} />
                </div>
                <div className="space-y-1.5">
                  {s.devices.os.map((o) => (
                    <div key={o.os} className="flex items-center gap-2 text-[13px] font-bold">
                      <span className="w-16 text-muted-foreground">{o.os}</span>
                      <div className="flex-1 h-3 rounded-full bg-border overflow-hidden"><div className="h-full bg-secondary rounded-full" style={{ width: `${o.share_pct}%` }} /></div>
                      <span className="w-10 text-right tabular-nums text-heading">{fmtPct(o.share_pct, 0)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            <div className="grid grid-cols-1 gap-2.5">
              <Link href="/direktor/izvjestaj" className="block"><Button className="w-full h-14"><FileText className="w-5 h-5" strokeWidth={2.6} /> Izvještaj za Ministarstvo</Button></Link>
              <Button variant="outline" className="w-full h-14" onClick={sendDigest} disabled={sending}><Send className="w-5 h-5" strokeWidth={2.6} /> {sending ? 'Šaljem…' : 'Pošalji sažetak'}</Button>
              {digest && <Card size="sm"><p className="text-[13px] font-bold text-foreground whitespace-pre-line">{digest}</p></Card>}
            </div>
          </>
        )
      }}
    </StatsPage>
  )
}
