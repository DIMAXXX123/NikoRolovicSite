import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ADMIN_ROLES, STAFF_ROLES, getCallerProfile, hasRole } from '@/lib/api-auth'
import { createServiceClient } from '@/lib/supabase/service'
import {
  classNumberSchema,
  emailSchema,
  parseBody,
  parseSearchParams,
  personNameSchema,
  sectionNumberSchema,
  uuidSchema,
} from '@/lib/api-validation'

/**
 * Server-side access to the verified_students roster for the admin panel.
 * The table holds pupils' names and e-mails and is service-role only, so the
 * admin screens go through here instead of querying Supabase from the browser.
 */

const AddStudentSchema = z.object({
  firstName: personNameSchema,
  lastName: personNameSchema,
  classNumber: classNumberSchema,
  sectionNumber: sectionNumberSchema,
  email: emailSchema.optional(),
})

const DeleteStudentSchema = z.object({ id: uuidSchema })

export async function GET() {
  const caller = await getCallerProfile()
  if (!hasRole(caller, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('verified_students')
    .select('id, first_name, last_name, class_number, section_number, email, used')
    .order('class_number', { ascending: true })
    .order('section_number', { ascending: true })
    .order('last_name', { ascending: true })

  if (error) {
    console.error('admin/students list failed', error.message)
    return NextResponse.json({ error: 'Failed to load students' }, { status: 500 })
  }

  return NextResponse.json({ students: data ?? [] })
}

export async function POST(request: Request) {
  const caller = await getCallerProfile()
  if (!hasRole(caller, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const parsed = await parseBody(request, AddStudentSchema)
  if (!parsed.ok) return parsed.response

  const { firstName, lastName, classNumber, sectionNumber, email } = parsed.data

  const admin = createServiceClient()
  const { error } = await admin.from('verified_students').insert({
    first_name: firstName,
    last_name: lastName,
    class_number: classNumber,
    section_number: sectionNumber,
    email: email ?? null,
  })

  if (error) {
    console.error('admin/students insert failed', error.message)
    return NextResponse.json({ error: 'Failed to add student' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const caller = await getCallerProfile()
  if (!hasRole(caller, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const parsed = parseSearchParams(request, DeleteStudentSchema)
  if (!parsed.ok) return parsed.response

  const admin = createServiceClient()
  const { error } = await admin.from('verified_students').delete().eq('id', parsed.data.id)

  if (error) {
    console.error('admin/students delete failed', error.message)
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
