import { NextResponse } from 'next/server'
import { DIREKTOR_ROLES, getCallerProfile, hasRole } from '@/lib/api-auth'
import { parseSearchParams } from '@/lib/api-validation'
import { STATS_CACHE_CONTROL, StatsQuerySchema, fetchDirektorStats, forbidden, serverError } from '@/lib/direktor-api'
import type { DirektorStats } from '@/lib/direktor-types'

/**
 * GET /api/direktor/stats?period=today|7d|30d|semester&class=&section=&subject=
 *
 * One JSON with every block of the Direktor panel (src/lib/direktor-types.ts
 * `DirektorStats`), computed by the SQL function direktor_stats(). Roles:
 * direktor / admin / creator / pedagog — checked here, server-side.
 */
export async function GET(request: Request) {
  const caller = await getCallerProfile()
  if (!hasRole(caller, DIREKTOR_ROLES)) return forbidden()

  const parsed = parseSearchParams(request, StatsQuerySchema)
  if (!parsed.ok) return parsed.response

  try {
    const stats = await fetchDirektorStats<DirektorStats>(parsed.data)
    return NextResponse.json(stats, { headers: { 'Cache-Control': STATS_CACHE_CONTROL } })
  } catch (err) {
    console.error('direktor/stats failed', err)
    return serverError('Failed to load stats')
  }
}
