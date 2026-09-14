'use client'

import Link from 'next/link'
import { ChevronLeft, Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { DirektorStats } from '@/lib/direktor-types'
import { PERIOD_LABELS, fmtDateLong, fmtNum, fmtPct, fmtSecs, usePeriod } from '../_lib/direktor-client'
import { HealthRing, StatsPage } from '../_components/blocks'

/** Print-friendly table row. */
function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 border-b border-border last:border-b-0 print:py-1">
      <span className="text-[14px] font-bold text-foreground">{label}{note && <span className="text-muted-foreground font-bold text-[12px]"> · {note}</span>}</span>
      <span className="text-[15px] font-extrabold text-heading tabular-nums text-right">{value}</span>
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 break-inside-avoid">
      <h3 className="text-[13px] font-extrabold uppercase tracking-[0.06em] text-muted-foreground">{title}</h3>
      <Card className="gap-0 py-2 print:border print:shadow-none print:rounded-none">{children}</Card>
    </section>
  )
}

function ReportBody({ s }: { s: DirektorStats }) {
  const h = s.health
  const L = s.learning
  const C = s.classes
  const T = s.teaching
  const Z = s.community
  const subjects = [...L.subjects].sort((a, b) => (b.avg_score ?? -1) - (a.avg_score ?? -1))
  const worstSections = [...C.matrix].filter((c) => !c.k_hidden).sort((a, b) => (a.composite ?? 101) - (b.composite ?? 101)).slice(0, 3)
  const bestSections = [...C.matrix].filter((c) => !c.k_hidden).sort((a, b) => (b.composite ?? -1) - (a.composite ?? -1)).slice(0, 3)
  const ai = s.ai.latest?.output

  return (
    <div className="space-y-5 print:space-y-4">
      <header className="space-y-1">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">JU OŠ „Niko Rolović” · Bar</p>
        <h1 className="text-[24px] leading-[1.2] font-extrabold tracking-[-0.01em] text-heading">Izvještaj o korišćenju aplikacije</h1>
        <p className="text-[13px] font-bold text-muted-foreground">
          Period: {PERIOD_LABELS[s.meta.period]} ({fmtDateLong(s.meta.from)} – {fmtDateLong(s.meta.to)}) · sastavljeno {fmtDateLong(s.meta.generated_at)}
        </p>
        {s.meta.demo_share > 50 && <p className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-[#C79000]">Demonstracioni podaci ({fmtPct(s.meta.demo_share, 0)} generisano)</p>}
      </header>

      <Card className="flex-row items-center gap-4 print:border print:shadow-none print:rounded-none">
        <HealthRing score={h.score === null ? null : Math.round(h.score)} size={84} />
        <div className="min-w-0 flex-1">
          <p className="text-[18px] leading-[1.25] font-extrabold text-heading">Zdravlje škole {h.score === null ? '—' : `${Math.round(h.score)}/100`}</p>
          <p className="text-[13px] font-bold text-muted-foreground">{h.delta === null ? 'bez poređenja sa prošlim periodom' : `${h.delta > 0 ? '+' : ''}${fmtNum(h.delta, 1)} u odnosu na prošlu sedmicu`}</p>
          <p className="text-[12px] font-bold text-muted-foreground mt-1">Indeks: aktivnost, zadržavanje, učenje, rezultati i pokrivenost učenika.</p>
        </div>
      </Card>

      {ai && (
        <Block title="Sažetak AI analize">
          <p className="py-2 text-[14px] leading-[1.55] font-bold text-foreground">{ai.summary}</p>
          {ai.recommendations.length > 0 && (
            <ol className="py-2 space-y-1 list-decimal pl-5 text-[13px] leading-[1.5] font-bold text-foreground">
              {ai.recommendations.slice(0, 4).map((r, i) => <li key={i}>{r.action}</li>)}
            </ol>
          )}
          <p className="py-1 text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">AI analiza agregiranih podataka · provjereno od strane uprave</p>
        </Block>
      )}

      <Block title="1. Obuhvat i aktivnost">
        <Row label="Učenika na spisku" value={fmtNum(s.kpi.verified_total, 0)} />
        <Row label="Registrovano u aplikaciji" value={`${fmtNum(s.kpi.registered, 0)} (${fmtPct(s.kpi.coverage_pct.value, 0)})`} />
        <Row label="Aktivno u zadnjih 7 dana" value={fmtNum(s.kpi.wau.value, 0)} note={s.kpi.wau.delta_pct === null ? undefined : `${s.kpi.wau.delta_pct > 0 ? '+' : ''}${fmtNum(s.kpi.wau.delta_pct, 0)}%`} />
        <Row label="Aktivno u zadnjih 30 dana" value={fmtNum(s.kpi.mau.value, 0)} />
        <Row label="Sesija u periodu" value={fmtNum(s.activity.totals.sessions, 0)} />
        <Row label="Prosječno trajanje sesije" value={fmtSecs(s.kpi.avg_session_s.value)} />
        <Row label="Sesija po učeniku sedmično" value={fmtNum(s.kpi.sessions_per_student_week.value, 1)} />
        {s.retention.last_cohort && <Row label="Zadržavanje D1 / D7 / D30" value={`${fmtPct(s.retention.last_cohort.d1, 0)} / ${fmtPct(s.retention.last_cohort.d7, 0)} / ${fmtPct(s.retention.last_cohort.d30, 0)}`} />}
      </Block>

      <Block title="2. Učenje">
        <Row label="Pročitanih lekcija" value={fmtNum(L.kpi.reads.value, 0)} />
        <Row label="Završenih kvizova" value={fmtNum(L.kpi.quizzes.value, 0)} />
        <Row label="Prosječan rezultat kviza" value={fmtPct(L.kpi.avg_score.value, 0)} />
        <Row label="Učenika sa kvizom sedmično" value={fmtPct(L.kpi.weekly_quiz_pct.value, 0)} />
        <Row label="Prosječno vrijeme na lekciji" value={fmtSecs(L.kpi.avg_lecture_time_s.value)} />
        <Row label="Učenika sa serijom 7+ dana" value={fmtNum(L.kpi.streaks_7.value, 0)} />
        <Row label="Lijevak: otvoreno → pročitano → kviz" value={`${fmtNum(L.funnel.opened, 0)} → ${fmtNum(L.funnel.read, 0)} → ${fmtNum(L.funnel.quiz_finished, 0)}`} />
      </Block>

      {subjects.length > 0 && (
        <Block title="3. Predmeti (prosjek kviza)">
          {subjects.map((sub) => (
            <Row key={sub.subject} label={sub.subject} value={sub.k_hidden ? 'premalo podataka' : fmtPct(sub.avg_score, 0)} note={`${sub.lectures_total} lekcija`} />
          ))}
        </Block>
      )}

      <Block title="4. Odjeljenja">
        <Row label="Odjeljenja sa aktivnošću" value={fmtNum(C.matrix.length, 0)} />
        <Row label="Učenika u riziku" value={fmtNum(C.at_risk.count, 0)} note="neaktivni 14+ dana ili pad rezultata" />
        {bestSections.length > 0 && <Row label="Najbolja odjeljenja" value={bestSections.map((c) => `${c.class_number}-${c.section_number}`).join(', ')} />}
        {worstSections.length > 0 && <Row label="Odjeljenja za pažnju" value={worstSections.map((c) => `${c.class_number}-${c.section_number}`).join(', ')} />}
        {C.by_class.map((c) => (
          <Row key={c.class_number} label={`${c.class_number}. razred`} value={`${fmtPct(c.active_7d_pct, 0)} aktivno · ${fmtPct(c.avg_score, 0)}`} note={`${c.registered}/${c.students_total}`} />
        ))}
      </Block>

      <Block title="5. Nastava i sadržaj">
        <Row label="Lekcija ukupno" value={fmtNum(T.kpi.lectures_total, 0)} />
        <Row label="Objavljeno u periodu" value={fmtNum(T.kpi.lectures_published.value, 0)} />
        <Row label="Profesora koji objavljuju" value={`${fmtNum(T.kpi.active_teachers.value, 0)} od ${fmtNum(T.kpi.teachers_total, 0)}`} />
        <Row label="Zastarjelih lekcija (90+ dana)" value={`${fmtNum(T.freshness.stale, 0)} (${fmtPct(T.freshness.stale_pct, 0)})`} />
        <Row label="AI nacrta lekcija" value={fmtNum(T.ai_drafts.total, 0)} note={T.ai_drafts.edited_before_publish_pct === null ? undefined : `${fmtPct(T.ai_drafts.edited_before_publish_pct, 0)} uređeno prije objave`} />
        <Row label="Moderacija: odobreno / odbijeno" value={`${fmtNum(T.moderation.approved, 0)} / ${fmtNum(T.moderation.rejected, 0)}`} />
      </Block>

      <Block title="6. Zajednica">
        <Row label="Doseg vijesti" value={fmtPct(Z.kpi.news_reach_pct.value, 0)} />
        <Row label="Lajkova" value={fmtNum(Z.kpi.likes.value, 0)} />
        <Row label="Pregleda događaja" value={fmtNum(Z.kpi.event_views.value, 0)} />
        <Row label="Fotografija poslato" value={fmtNum(Z.kpi.gallery_uploads.value, 0)} />
        <Row label="Partija igre" value={fmtNum(Z.kpi.game_sessions.value, 0)} />
        <Row label="eDnevnik povezan" value={`${fmtNum(Z.ednevnik.connected, 0)} (${fmtPct(Z.ednevnik.connected_pct, 0)})`} />
        <Row label="PWA instalirano" value={fmtPct(s.devices.pwa_share_pct, 0)} />
      </Block>

      {s.signals.length > 0 && (
        <Block title="7. Signali za pažnju">
          <ul className="py-2 space-y-1.5 text-[13px] leading-[1.5] font-bold text-foreground">
            {s.signals.slice(0, 8).map((sig, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ background: sig.severity === 'critical' ? '#FF4B4B' : sig.severity === 'warn' ? '#FFC800' : '#1CB0F6' }} />
                <span>{sig.text}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      <footer className="pt-2 text-[11px] leading-[1.5] font-bold text-muted-foreground">
        Podaci su agregirani; nijedan pojedinačni učenik nije prikazan. Grupe manje od {s.meta.k_min} učenika su sakrivene radi zaštite privatnosti.
        {s.meta.collecting_since && <> Prikupljanje od {fmtDateLong(s.meta.collecting_since)}.</>}
      </footer>
    </div>
  )
}

export default function DirektorIzvjestaj() {
  const { period } = usePeriod()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Link href="/direktor" className="inline-flex items-center gap-1 h-11 text-[13px] font-extrabold uppercase tracking-[0.04em] text-secondary">
          <ChevronLeft className="w-5 h-5" strokeWidth={2.6} /> Pregled
        </Link>
        <div className="flex gap-2">
          <a href={`/api/direktor/export?format=csv&screen=pregled&period=${period}`} className="inline-flex">
            <Button variant="outline" size="sm" className="h-11"><Download className="w-4 h-4" strokeWidth={2.6} /> CSV</Button>
          </a>
          <Button size="sm" className="h-11" onClick={() => window.print()}><Printer className="w-4 h-4" strokeWidth={2.6} /> Štampaj / PDF</Button>
        </div>
      </div>
      <StatsPage>{(s) => <ReportBody s={s} />}</StatsPage>
    </div>
  )
}
