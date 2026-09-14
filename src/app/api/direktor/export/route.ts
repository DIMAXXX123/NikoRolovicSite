import { NextResponse } from 'next/server'
import { z } from 'zod'
import { DIREKTOR_ROLES, getCallerProfile, hasRole } from '@/lib/api-auth'
import { parseSearchParams } from '@/lib/api-validation'
import { StatsQuerySchema, fetchDirektorStats, forbidden, serverError, toCsv, writeAudit } from '@/lib/direktor-api'
import type { DirektorStats, Kpi } from '@/lib/direktor-types'

/**
 * GET /api/direktor/export?format=csv&screen=pregled|ucenje|razredi|nastava|zajednica&period=&class=&section=&subject=
 *
 * CSV of what the given screen shows (spec §5.2), built server-side from
 * direktor_stats() with the same filters. Roles: direktor / admin / creator /
 * pedagog. Every export is written to audit_log. `format=pdf` is not served
 * here — the print-ready report lives at /direktor/izvjestaj.
 */
const SCREENS = ['pregled', 'ucenje', 'razredi', 'nastava', 'zajednica'] as const
type Screen = (typeof SCREENS)[number]

const QuerySchema = StatsQuerySchema.extend({
  format: z.enum(['csv']).default('csv'),
  screen: z.enum(SCREENS).default('pregled'),
})

function kpiRow(label: string, k: Kpi): unknown[] {
  return [label, k.value, k.prev, k.delta_pct]
}

function buildCsv(screen: Screen, s: DirektorStats): string {
  switch (screen) {
    case 'pregled': {
      const rows: unknown[][] = [
        ['Zdravlje škole', s.health.score, s.health.prev_score, s.health.delta],
        kpiRow('Aktivni danas', s.kpi.active_today),
        kpiRow('Aktivni 7 dana', s.kpi.wau),
        kpiRow('Aktivni 30 dana', s.kpi.mau),
        kpiRow('Pokrivenost %', s.kpi.coverage_pct),
        kpiRow('Prosječno vrijeme po sesiji (s)', s.kpi.avg_session_s),
        kpiRow('Sesija po učeniku sedmično', s.kpi.sessions_per_student_week),
        ['Zadržavanje D1 %', s.retention.last_cohort?.d1 ?? null, null, null],
        ['Zadržavanje D7 %', s.retention.last_cohort?.d7 ?? null, null, null],
        ['Zadržavanje D30 %', s.retention.last_cohort?.d30 ?? null, null, null],
        ['PWA instalacije %', s.devices.pwa_share_pct, null, null],
        ['eDnevnik povezan %', s.devices.ednevnik_pct, null, null],
        ['Učenici u riziku', s.classes.at_risk.count, null, null],
      ]
      for (const sig of s.signals) rows.push([`Signal (${sig.severity})`, sig.text, null, sig.value])
      return toCsv(['Metrika', 'Vrijednost', 'Prethodni period', 'Promjena %'], rows)
    }
    case 'ucenje':
      return toCsv(
        ['Predmet', 'Lekcija ukupno', 'Otvaranja', 'Čitanja', 'Kviz započet', 'Kviz završen', 'Prosjek %', 'Prethodni prosjek %', 'Medijana %', 'P25 %', 'Napušteno %', 'Prosječno vrijeme (s)', 'Učenika', 'Skriveno (privatnost)'],
        s.learning.subjects.map((r) => [
          r.subject, r.lectures_total, r.opens, r.reads, r.quiz_starts, r.quiz_finishes, r.avg_score, r.prev_avg_score,
          r.median_score, r.p25_score, r.abandon_rate, r.avg_time_s, r.students, r.k_hidden ? 'da' : 'ne',
        ])
      )
    case 'razredi':
      return toCsv(
        ['Razred', 'Odjeljenje', 'Učenika', 'Registrovano', 'Aktivni 7d', 'Aktivni 7d %', 'Aktivni 30d', 'Čitanja po učeniku', 'Kvizova po učeniku', 'Prosjek %', 'Trend 7d %', 'Kompozit', 'Rang', 'Skriveno (privatnost)'],
        s.classes.matrix.map((r) => [
          r.class_number, r.section_number, r.students_total, r.registered, r.active_7d, r.active_7d_pct, r.active_30d,
          r.lectures_read_per_student, r.quizzes_per_student, r.avg_score, r.trend_7d_pct, r.composite, r.rank, r.k_hidden ? 'da' : 'ne',
        ])
      )
    case 'nastava':
      return toCsv(
        ['Nastavnik', 'Predmet', 'Lekcija', 'Otvaranja', 'Čitanja', 'Prosjek %', 'Dana od objave', 'Status'],
        s.teaching.teachers.map((t) => [t.name, t.subject, t.lectures, t.opens, t.reads, t.avg_score, t.days_since_publish, t.status])
      )
    case 'zajednica':
      return toCsv(
        ['Vijest', 'Objavljeno', 'Pregledi', 'Jedinstveni', 'Doseg %', 'Lajkovi', 'Dan vrhunca', 'Dana do vrhunca'],
        s.community.news.map((n) => [n.title, n.created_at, n.views, n.viewers, n.reach_pct, n.likes, n.peak_day, n.days_to_peak])
      )
  }
}

export async function GET(request: Request) {
  const caller = await getCallerProfile()
  if (!caller || !hasRole(caller, DIREKTOR_ROLES)) return forbidden()

  const parsed = parseSearchParams(request, QuerySchema)
  if (!parsed.ok) return parsed.response
  const { screen, format, ...filters } = parsed.data

  try {
    const stats = await fetchDirektorStats<DirektorStats>(filters)
    const csv = buildCsv(screen, stats)
    await writeAudit(caller, 'direktor.export', 'app_events', screen, { format, ...filters })

    const filename = `direktor-${screen}-${filters.period}.csv`
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    console.error('direktor/export failed', err)
    return serverError('Failed to export')
  }
}
