import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit } from '@/lib/rate-limit'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Normalize Montenegrin/Serbian Latin diacritics: č→c, ć→c, š→s, ž→z, đ→dj
function normalizeCG(str: string): string {
  return str
    .replace(/[čć]/gi, (m) => m === m.toUpperCase() ? 'C' : 'c')
    .replace(/š/gi, (m) => m === m.toUpperCase() ? 'S' : 's')
    .replace(/ž/gi, (m) => m === m.toUpperCase() ? 'Z' : 'z')
    .replace(/đ/gi, (m) => m === m.toUpperCase() ? 'DJ' : 'dj')
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rateLimitExceeded = checkRateLimit(`register:${ip}`, 5, 60_000)
  if (rateLimitExceeded) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const admin = getAdmin()

  try {
    const { firstName, lastName, classNumber, sectionNumber, email, password } = await req.json()

    if (!firstName || !lastName || !classNumber || !sectionNumber || !email || !password) {
      return NextResponse.json({ error: 'Sva polja su obavezna' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Lozinka mora imati minimum 6 karaktera' }, { status: 400 })
    }

    // Check verified_students (with diacritics normalization: č/ć→c, š→s, ž→z, đ→dj)
    const { data: candidates } = await admin
      .from('verified_students')
      .select('id, used, first_name, last_name')
      .eq('class_number', classNumber)
      .eq('section_number', sectionNumber)

    const inputFirst = normalizeCG(firstName.trim().toLowerCase())
    const inputLast = normalizeCG(lastName.trim().toLowerCase())

    const verified = (candidates || []).find(c =>
      normalizeCG((c.first_name || '').toLowerCase()) === inputFirst &&
      normalizeCG((c.last_name || '').toLowerCase()) === inputLast
    )

    if (!verified) {
      return NextResponse.json({ error: 'Nismo te pronašli u bazi učenika. Proveri podatke.' }, { status: 404 })
    }

    if (verified.used) {
      return NextResponse.json({ error: 'Ovaj učenik je već registrovan.' }, { status: 409 })
    }

    const verifiedId = verified.id

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

    // Create profile — use original name from verified_students (with proper diacritics)
    await admin.from('profiles').insert({
      id: authData.user.id,
      first_name: verified.first_name || firstName.trim(),
      last_name: verified.last_name || lastName.trim(),
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
