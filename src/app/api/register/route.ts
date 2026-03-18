import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const admin = getAdmin()

  try {
    const { firstName, lastName, classNumber, sectionNumber, email, password } = await req.json()

    if (!firstName || !lastName || !classNumber || !sectionNumber || !email || !password) {
      return NextResponse.json({ error: 'Sva polja su obavezna' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Lozinka mora imati minimum 6 karaktera' }, { status: 400 })
    }

    // Check verified_students
    const { data: verified, error: verifyError } = await admin
      .from('verified_students')
      .select('id, used')
      .eq('first_name', firstName.trim())
      .eq('last_name', lastName.trim())
      .eq('class_number', classNumber)
      .eq('section_number', sectionNumber)
      .single()

    let verifiedId = verified?.id

    if (verifyError || !verified) {
      // BETA MODE: auto-add student to verified_students
      const { data: newStudent, error: insertErr } = await admin
        .from('verified_students')
        .insert({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          class_number: classNumber,
          section_number: sectionNumber,
          used: false,
        })
        .select('id')
        .single()

      if (insertErr || !newStudent) {
        return NextResponse.json({ error: 'Greška pri registraciji. Pokušaj ponovo.' }, { status: 500 })
      }
      verifiedId = newStudent.id
    }

    if (verified?.used) {
      return NextResponse.json({ error: 'Ovaj učenik je već registrovan.' }, { status: 409 })
    }

    // Create user via admin — email auto-confirmed, no OTP needed
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
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

    // Create profile
    await admin.from('profiles').insert({
      id: authData.user.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      class_number: classNumber,
      section_number: sectionNumber,
      role: 'student',
    })

    return NextResponse.json({ ok: true, userId: authData.user.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
