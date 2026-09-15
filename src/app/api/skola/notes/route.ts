import { NextResponse } from 'next/server'
import { z } from 'zod'
import { SKOLA_WRITE_ROLES, getCallerProfile, hasRole } from '@/lib/api-auth'
import { parseBody } from '@/lib/api-validation'
import { forbidden, serverError } from '@/lib/direktor-api'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * POST /api/skola/notes  { class, section, kind, text, student_name? }
 * Behaviour note (pohvala / opomena / napomena) written by staff. Homeroom
 * teachers may only write about their own section.
 *
 * DELETE /api/skola/notes?id=<uuid>  — author or direktor/admin.
 */

const BodySchema = z.object({
  class: z.coerce.number().int().min(1).max(4),
  section: z.coerce.number().int().min(1).max(6),
  kind: z.enum(['pohvala', 'opomena', 'napomena']),
  text: z.string().trim().min(3).max(1000),
  student_name: z.string().trim().max(80).optional().transform((v) => (v ? v : null)),
})

export async function POST(request: Request) {
  const caller = await getCallerProfile()
  if (!caller || !hasRole(caller, SKOLA_WRITE_ROLES)) return forbidden()

  const parsed = await parseBody(request, BodySchema)
  if (!parsed.ok) return parsed.response
  const b = parsed.data

  if (caller.role === 'razredni' && (caller.homeroom_class !== b.class || caller.homeroom_section !== b.section)) {
    return NextResponse.json({ error: 'Razredni starješina može pisati samo za svoje odjeljenje' }, { status: 403 })
  }

  const admin = createServiceClient()
  const { data: profile } = await admin.from('profiles').select('first_name, last_name').eq('id', caller.id).maybeSingle()
  const authorName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : null

  const { data, error } = await admin
    .from('school_notes')
    .insert({
      class_number: b.class,
      section_number: b.section,
      kind: b.kind,
      text: b.text,
      student_name: b.student_name,
      author_id: caller.id,
      author_name: authorName,
      source: 'manual',
    })
    .select('id, class_number, section_number, student_name, kind, text, author_name, created_at')
    .single()
  if (error) {
    console.error('skola/notes insert failed', error.message)
    return serverError('Failed')
  }
  return NextResponse.json({ note: data }, { status: 201 })
}

export async function DELETE(request: Request) {
  const caller = await getCallerProfile()
  if (!caller || !hasRole(caller, SKOLA_WRITE_ROLES)) return forbidden()
  const id = new URL(request.url).searchParams.get('id') ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Bad id' }, { status: 400 })

  const admin = createServiceClient()
  const { data: note } = await admin.from('school_notes').select('id, author_id').eq('id', id).maybeSingle()
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const mayDelete = note.author_id === caller.id || ['direktor', 'admin', 'creator'].includes(caller.role)
  if (!mayDelete) return forbidden()

  const { error } = await admin.from('school_notes').delete().eq('id', id)
  if (error) return serverError('Failed')
  return NextResponse.json({ ok: true })
}
