import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import {
  classNumberSchema,
  parseBody,
  personNameSchema,
  sectionNumberSchema,
} from '@/lib/api-validation'
import { findVerifiedStudent } from '@/lib/verified-students'

/**
 * Finishes registration for a user who signed in through an OAuth/OTP flow and
 * has no profile row yet: checks the pupil against the verified_students
 * roster, creates the profile and marks the roster entry as used.
 *
 * The roster lookup used to happen in the browser, which required the roster
 * table to be readable by every signed-in user. It is service-role only now.
 */

const CompleteProfileSchema = z.object({
  firstName: personNameSchema,
  lastName: personNameSchema,
  classNumber: classNumberSchema,
  sectionNumber: sectionNumberSchema,
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 })
  }

  const rate = await checkRateLimit(`complete-profile:${user.id}:${clientIp(request)}`, 10, 60_000)
  if (rate.limited) {
    return NextResponse.json(
      { error: 'Previše pokušaja. Pokušaj ponovo kasnije.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
    )
  }

  const parsed = await parseBody(request, CompleteProfileSchema, 'Unesite ime i prezime')
  if (!parsed.ok) return parsed.response

  const { firstName, lastName, classNumber, sectionNumber } = parsed.data
  const admin = createServiceClient()

  const { data: candidates, error: rosterError } = await admin
    .from('verified_students')
    .select('id, first_name, last_name, used')
    .eq('class_number', classNumber)
    .eq('section_number', sectionNumber)

  if (rosterError) {
    console.error('complete-profile roster lookup failed', rosterError.message)
    return NextResponse.json({ error: 'Greška na serveru. Pokušajte ponovo.' }, { status: 500 })
  }

  const student = findVerifiedStudent(candidates, firstName, lastName)

  if (!student) {
    return NextResponse.json(
      { error: 'Niste na spisku učenika. Provjerite da li ste pravilno unijeli podatke.' },
      { status: 404 }
    )
  }

  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  // A used entry is fine only when this very user is the one who claimed it.
  if (student.used && !existingProfile) {
    return NextResponse.json(
      { error: 'Ovaj učenik je već registrovan. Ako mislite da je greška, obratite se administratoru.' },
      { status: 409 }
    )
  }

  const { error: upsertError } = await admin.from('profiles').upsert(
    {
      id: user.id,
      email: user.email,
      first_name: student.first_name ?? firstName,
      last_name: student.last_name ?? lastName,
      class_number: classNumber,
      section_number: sectionNumber,
    },
    { onConflict: 'id' }
  )

  if (upsertError) {
    console.error('complete-profile upsert failed', upsertError.message)
    return NextResponse.json({ error: 'Greška pri čuvanju profila. Pokušajte ponovo.' }, { status: 500 })
  }

  if (!student.used) {
    await admin.from('verified_students').update({ used: true }).eq('id', student.id)
  }

  return NextResponse.json({
    ok: true,
    firstName: student.first_name ?? firstName,
    lastName: student.last_name ?? lastName,
  })
}
