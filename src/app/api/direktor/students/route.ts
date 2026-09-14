import { NextResponse } from 'next/server'
import { z } from 'zod'
import { STUDENT_LIST_ROLES, getCallerProfile, hasRole } from '@/lib/api-auth'
import { classNumberSchema, parseSearchParams, sectionNumberSchema } from '@/lib/api-validation'
import { forbidden, rpcJson, serverError, writeAudit } from '@/lib/direktor-api'
import type { DirektorStudents } from '@/lib/direktor-types'

/**
 * GET /api/direktor/students?class=3&section=4
 *
 * At-risk pupils of one section WITH names — the only endpoint that returns
 * names (spec §2.4). Roles: direktor / admin / creator / pedagog; razredni for
 * their own homeroom only. Every call is written to audit_log.
 */
const QuerySchema = z.object({ class: classNumberSchema, section: sectionNumberSchema })

export async function GET(request: Request) {
  const caller = await getCallerProfile()
  if (!caller || !hasRole(caller, STUDENT_LIST_ROLES)) return forbidden()

  const parsed = parseSearchParams(request, QuerySchema)
  if (!parsed.ok) return parsed.response
  const { class: classNumber, section } = parsed.data

  if (caller.role === 'razredni' && (caller.homeroom_class !== classNumber || caller.homeroom_section !== section)) {
    return forbidden()
  }

  try {
    const data = await rpcJson<DirektorStudents>('direktor_students', {
      class_number: classNumber,
      section_number: section,
    })
    await writeAudit(caller, 'direktor.students', 'verified_students', `${classNumber}-${section}`, {
      class: classNumber,
      section,
      at_risk: data.at_risk.length,
    })
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (err) {
    console.error('direktor/students failed', err)
    return serverError('Failed to load students')
  }
}
