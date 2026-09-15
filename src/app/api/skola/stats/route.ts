import { NextResponse } from 'next/server'
import { z } from 'zod'
import { SKOLA_ROLES, getCallerProfile, hasRole } from '@/lib/api-auth'
import { parseSearchParams } from '@/lib/api-validation'
import { STATS_CACHE_CONTROL, forbidden, optionalClassSchema, optionalSectionSchema, optionalSubjectSchema, rpcJson, serverError } from '@/lib/direktor-api'
import type { DirektorStats } from '@/lib/direktor-types'
import { SKOLA_PERIODS, type SectionRank, type SkolaPeriod, type SkolaStats } from '@/lib/skola-types'

/**
 * GET /api/skola/stats?period=30d|semester|year|prev_year&class=&section=&subject=
 *
 * Grades, absences and behaviour notes from skola_stats() plus the quiz part
 * of the app statistics (direktor_stats_cached) and a section ranking.
 * Roles: direktor / pedagog / razredni / admin / creator.
 */

const QuerySchema = z.object({
  period: z.enum(SKOLA_PERIODS as [SkolaPeriod, ...SkolaPeriod[]]).default('year'),
  class: optionalClassSchema,
  section: optionalSectionSchema,
  subject: optionalSubjectSchema,
})

type Raw = Omit<SkolaStats, 'quizzes' | 'ranking'>

/** App-usage period that best matches the school period. */
function appPeriod(p: SkolaPeriod): 'today' | '7d' | '30d' | 'semester' {
  if (p === '7d') return '7d'
  if (p === '30d') return '30d'
  return 'semester'
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}

/** 50 % grades (1–5 → 0–100), 25 % attendance (100 − unjustified %), 25 % quiz average. */
function buildRanking(raw: Raw, app: DirektorStats | null): SectionRank[] {
  const att = new Map(raw.attendance.by_section.map((a) => [`${a.class_number}-${a.section_number}`, a]))
  const quiz = new Map((app?.classes.matrix ?? []).map((c) => [`${c.class_number}-${c.section_number}`, c.avg_score]))
  const rows = raw.grades.by_section.map((g) => {
    const key = `${g.class_number}-${g.section_number}`
    const a = att.get(key)
    const q = quiz.get(key) ?? null
    let score: number | null = null
    if (!g.k_hidden && g.avg !== null) {
      const gradePart = ((g.avg - 1) / 4) * 100
      const attPart = a ? 100 - clamp(a.unjustified_pct ?? 0, 0, 100) : 85
      const quizPart = q ?? gradePart
      score = Math.round(0.5 * gradePart + 0.25 * attPart + 0.25 * quizPart)
    }
    return {
      class_number: g.class_number,
      section_number: g.section_number,
      rank: 0,
      score,
      grade_avg: g.avg,
      prev_grade_avg: g.prev_avg,
      unjustified_pct: a?.unjustified_pct ?? null,
      absences_per_student: a?.per_student ?? null,
      quiz_avg: q,
      k_hidden: g.k_hidden,
    }
  })
  rows.sort((x, y) => (y.score ?? -1) - (x.score ?? -1))
  rows.forEach((r, i) => { r.rank = r.score === null ? 0 : i + 1 })
  return rows
}

export async function GET(request: Request) {
  const caller = await getCallerProfile()
  if (!hasRole(caller, SKOLA_ROLES)) return forbidden()

  const parsed = parseSearchParams(request, QuerySchema)
  if (!parsed.ok) return parsed.response
  const q = parsed.data

  try {
    const [raw, app] = await Promise.all([
      rpcJson<Raw>('skola_stats_cached', { p_period: q.period, p_class: q.class, p_section: q.section, p_subject: q.subject }),
      rpcJson<DirektorStats>('direktor_stats_cached', { period: appPeriod(q.period), class_number: q.class, section_number: q.section, subject: q.subject }).catch((e) => {
        console.error('skola/stats: app stats unavailable', e)
        return null
      }),
    ])
    const body: SkolaStats = {
      ...raw,
      quizzes: {
        by_subject: app?.learning.subjects ?? [],
        risk_topics: app?.learning.risk_topics ?? [],
        score_hist: app?.learning.score_hist ?? { bins: [], total: 0, below_50_pct: null },
        period: appPeriod(q.period),
      },
      ranking: buildRanking(raw, app),
    }
    return NextResponse.json(body, { headers: { 'Cache-Control': STATS_CACHE_CONTROL } })
  } catch (err) {
    console.error('skola/stats failed', err)
    return serverError('Failed to load school stats')
  }
}
