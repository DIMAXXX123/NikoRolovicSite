import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCallerProfile } from '@/lib/api-auth'
import { parseBody } from '@/lib/api-validation'
import { forbidden, rpcJson, serverError } from '@/lib/direktor-api'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * POST /api/skola/sync  { subjects: [{name, grades: [{grade, type, date}]}], absences?: [{date, hours, justified}] }
 *
 * Called by the eDnevnik page after a successful sync: the pupil's own grades
 * (and absences, when the dnevnik returns them) are stored under their
 * profile id so the Škola panel can aggregate real marks across everyone who
 * connected. Only the caller's own rows; class/section come from the profile.
 */

const BodySchema = z.object({
  subjects: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        grades: z.array(z.object({ grade: z.number().int().min(1).max(5), type: z.string().max(30).optional(), date: z.string().max(20).optional() })).max(200),
      })
    )
    .max(40),
  absences: z.array(z.object({ date: z.string().max(20), hours: z.number().int().min(1).max(8).default(1), justified: z.boolean().nullable().default(null) })).max(500).optional(),
})

function toIsoDate(s: string | undefined): string | null {
  if (!s) return null
  const t = s.trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10)
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(t)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  const d = new Date(t)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

export async function POST(request: Request) {
  const caller = await getCallerProfile()
  if (!caller) return forbidden()

  const parsed = await parseBody(request, BodySchema)
  if (!parsed.ok) return parsed.response
  const b = parsed.data

  const admin = createServiceClient()
  const { data: profile } = await admin.from('profiles').select('class_number, section_number').eq('id', caller.id).maybeSingle()
  const cls = profile?.class_number
  const sec = profile?.section_number
  if (!cls || !sec || cls < 1 || cls > 4 || sec < 1 || sec > 6) {
    return NextResponse.json({ error: 'Profil nema razred/odjeljenje' }, { status: 400 })
  }

  const today = new Date().toISOString().slice(0, 10)
  const grades = b.subjects.flatMap((s) =>
    s.grades.flatMap((g) => {
      const date = toIsoDate(g.date) ?? today
      return [{ student_key: caller.id, class_number: cls, section_number: sec, subject: s.name, grade: g.grade, grade_type: g.type?.slice(0, 30) ?? null, graded_on: date, source: 'ednevnik', created_by: caller.id }]
    })
  )
  const absences = (b.absences ?? []).flatMap((a) => {
    const date = toIsoDate(a.date)
    return date ? [{ student_key: caller.id, class_number: cls, section_number: sec, absent_on: date, hours: a.hours, justified: a.justified, source: 'ednevnik', created_by: caller.id }] : []
  })

  try {
    const [g, a] = await Promise.all([
      grades.length ? rpcJson<number>('school_import', { p_kind: 'grades', p_rows: grades }) : Promise.resolve(0),
      absences.length ? rpcJson<number>('school_import', { p_kind: 'absences', p_rows: absences }) : Promise.resolve(0),
    ])
    return NextResponse.json({ grades: g, absences: a })
  } catch (err) {
    console.error('skola/sync failed', err)
    return serverError('Sync failed')
  }
}
