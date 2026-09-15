import { NextResponse } from 'next/server'
import { z } from 'zod'
import { NASTAVNIK_PICKER_ROLES, NASTAVNIK_ROLES, getCallerProfile, hasRole } from '@/lib/api-auth'
import { parseSearchParams, uuidSchema } from '@/lib/api-validation'
import { DEMO_ACCOUNTS } from '@/lib/demo-accounts'
import { STATS_CACHE_CONTROL, forbidden, periodSchema, rpcJson, serverError } from '@/lib/direktor-api'
import type { NastavnikStats } from '@/lib/direktor-types'

/**
 * GET /api/nastavnik/stats?period=7d&author=<uuid>
 *
 * The teacher panel as one JSON (`NastavnikStats`). Roles: teacher / razredni
 * / pedagog / direktor / admin / creator. `author` may be set only by
 * pedagog / direktor / admin / creator (the teacher picker); teachers always
 * get their own lectures.
 *
 * Demo mode: the shared "Profesor" account (demo-nastavnik) has authored no
 * lectures and would see an empty panel. For that account only, when it has
 * zero lectures, the response falls back to the author with the most lectures
 * and flags it with `meta.fallback_author = true`.
 */
const QuerySchema = z.object({
  period: periodSchema,
  author: z
    .union([z.literal(''), uuidSchema])
    .optional()
    .transform((v) => (v ? v : null)),
})

export async function GET(request: Request) {
  const caller = await getCallerProfile()
  if (!caller || !hasRole(caller, NASTAVNIK_ROLES)) return forbidden()

  const parsed = parseSearchParams(request, QuerySchema)
  if (!parsed.ok) return parsed.response
  const { period } = parsed.data

  const canPick = hasRole(caller, NASTAVNIK_PICKER_ROLES)
  const author = canPick && parsed.data.author ? parsed.data.author : caller.id

  try {
    let stats = await rpcJson<NastavnikStats>('nastavnik_stats_cached', { author, period })

    const isDemoTeacher = caller.email === DEMO_ACCOUNTS.nastavnik.email
    if (isDemoTeacher && !parsed.data.author && stats.kpi.lectures_total === 0 && stats.authors.length > 0) {
      const top = stats.authors[0]
      stats = await rpcJson<NastavnikStats>('nastavnik_stats_cached', { author: top.id, period })
      stats.meta.fallback_author = true
    }

    return NextResponse.json(stats, { headers: { 'Cache-Control': STATS_CACHE_CONTROL } })
  } catch (err) {
    console.error('nastavnik/stats failed', err)
    return serverError('Failed to load stats')
  }
}
