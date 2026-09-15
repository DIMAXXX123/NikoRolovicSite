'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/card'
import { KpiTile, Metric, SectionTitle } from '../nastavnik/_components/widgets'
import { fmtNum, fmtPct } from '../direktor/_lib/direktor-client'
import { AppPage } from './_lib/app-client'

/** Publika: who uses the app — active pupils, retention, growth. */
export default function AplikacijaPublika() {
  return (
    <AppPage>
      {(s) => {
        const activity = s.activity.series.map((p, i) => ({ date: p.date.slice(5), dau: p.dau, prev: s.activity.prev_series[i]?.dau ?? null }))
        const growth = s.activity.series.map((p) => ({ date: p.date.slice(5), n: p.new_users }))
        return (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <KpiTile label="Aktivni danas" value={fmtNum(s.kpi.active_today.value, 0)} kpi={s.kpi.active_today} info="Učenici sa bar jednom sesijom danas." />
              <KpiTile label="Aktivni 7 dana" value={fmtNum(s.kpi.wau.value, 0)} kpi={s.kpi.wau} color="#58CC02" info="Različiti učenici aktivni u zadnjih 7 dana." />
              <KpiTile label="Aktivni 30 dana" value={fmtNum(s.kpi.mau.value, 0)} kpi={s.kpi.mau} color="#CE82FF" info="Različiti učenici aktivni u zadnjih 30 dana." />
              <KpiTile label="Registrovano" value={fmtPct(s.kpi.coverage_pct.value, 0)} kpi={s.kpi.coverage_pct} color="#FFC800" info={`${s.kpi.registered} od ${s.kpi.verified_total} učenika sa spiska ima nalog.`} />
            </div>

            <section className="space-y-2.5">
              <SectionTitle info="Dnevno aktivni učenici (plavo) i isti dani prošlog perioda (sivo).">Aktivnost po danima</SectionTitle>
              <Card>
                <div className="h-[190px]">
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
                  <Metric label="Sesija sedmično / učenik" value={fmtNum(s.kpi.sessions_per_student_week.value, 1)} />
                  <Metric label="Novih učenika" value={fmtNum(s.activity.totals.new_users, 0)} tone="good" />
                </div>
              </Card>
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Udio učenika koji se vrate 1., 7. i 30. dan nakon prve sesije (zadnja kohorta).">Vraćaju li se</SectionTitle>
              <Card className="gap-3">
                {s.retention.last_cohort ? (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[['Sjutradan', s.retention.last_cohort.d1], ['Poslije 7 dana', s.retention.last_cohort.d7], ['Poslije 30 dana', s.retention.last_cohort.d30]].map(([k, v]) => (
                      <div key={String(k)} className="rounded-xl bg-muted py-3 px-1">
                        <span className="block text-[24px] leading-none font-extrabold text-heading tabular-nums">{fmtPct(v as number | null, 0)}</span>
                        <span className="block mt-1 text-[10px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{k}</span>
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
                        <Tooltip formatter={(v) => [`${fmtNum(Number(v), 0)}%`, 'Vratili se poslije 7 dana']} />
                        <Line type="monotone" dataKey="d7" stroke="#CE82FF" strokeWidth={3} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Nove registracije po danima.">Rast</SectionTitle>
              <Card>
                <div className="h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growth} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} minTickGap={24} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 800, fill: '#777' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="n" name="Novi" stroke="#58CC02" strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </section>
          </>
        )
      }}
    </AppPage>
  )
}
