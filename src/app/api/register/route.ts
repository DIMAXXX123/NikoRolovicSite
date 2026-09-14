import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import {
  parseBody,
  classNumberSchema,
  emailSchema,
  passwordSchema,
  personNameSchema,
  sectionNumberSchema,
} from '@/lib/api-validation'
import { findVerifiedStudent } from '@/lib/verified-students'

const RegisterSchema = z.object({
  firstName: personNameSchema,
  lastName: personNameSchema,
  classNumber: classNumberSchema,
  sectionNumber: sectionNumberSchema,
  email: emailSchema,
  password: passwordSchema,
})

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  const rate = await checkRateLimit(`register:${ip}`, 5, 60_000)
  if (rate.limited) {
    return NextResponse.json(
      { error: 'Previše zahtjeva. Pokušaj ponovo kasnije.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
    )
  }

  const parsed = await parseBody(req, RegisterSchema, 'Sva polja su obavezna')
  if (!parsed.ok) return parsed.response

  const { firstName, lastName, classNumber, sectionNumber, email, password } = parsed.data

  try {
    // verified_students is service-role only (no RLS policies), so this lookup
    // can only happen here on the server.
    const admin = createServiceClient()

    const { data: candidates } = await admin
      .from('verified_students')
      .select('id, used, first_name, last_name')
      .eq('class_number', classNumber)
      .eq('section_number', sectionNumber)

    const verified = findVerifiedStudent(candidates, firstName, lastName)

    if (!verified) {
      return NextResponse.json({ error: 'Nismo te pronašli u bazi učenika. Proveri podatke.' }, { status: 404 })
    }

    if (verified.used) {
      return NextResponse.json({ error: 'Ovaj učenik je već registrovan.' }, { status: 409 })
    }

    const verifiedId = verified.id

    // Create user via admin — email auto-confirmed, no OTP needed
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        class_number: classNumber,
        section_number: sectionNumber,
      },
    })

    if (authError) {
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        return NextResponse.json({ error: 'Ovaj email je već registrovan.' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Greška pri kreiranju korisnika' }, { status: 500 })
    }

    // Mark student as used
    await admin
      .from('verified_students')
      .update({ used: true })
      .eq('id', verifiedId)

    // Create profile — use original name from verified_students (with proper diacritics)
    await admin.from('profiles').insert({
      id: authData.user.id,
      first_name: verified.first_name || firstName,
      last_name: verified.last_name || lastName,
      email,
      class_number: classNumber,
      section_number: sectionNumber,
      role: 'student',
    })

    return NextResponse.json({ ok: true, userId: authData.user.id })
  } catch (err) {
    console.error('register failed', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
