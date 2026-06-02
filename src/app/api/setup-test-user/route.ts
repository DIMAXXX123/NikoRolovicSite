import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TEST_EMAIL = 'test@nikorolovic.me'
const TEST_PASSWORD = 'test123456'

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  const supabase = createClient(url, key)

  try {
    // Check if already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 100 })
    const existing = existingUsers?.users?.find(u => u.email === TEST_EMAIL)

    let userId: string

    if (existing) {
      // Reset password
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: TEST_PASSWORD,
        email_confirm: true,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      userId = existing.id
    } else {
      // Create user
      const { data, error } = await supabase.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { first_name: 'Test', last_name: 'User', class_number: 1, section_number: 1 },
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      userId = data.user.id
    }

    // Upsert profile
    await supabase.from('profiles').upsert({
      id: userId,
      first_name: 'Test',
      last_name: 'User',
      email: TEST_EMAIL,
      class_number: 1,
      section_number: 1,
      role: 'student',
    }, { onConflict: 'id' })

    // Mark in verified_students
    await supabase.from('verified_students').upsert({
      first_name: 'Test',
      last_name: 'User',
      class_number: 1,
      section_number: 1,
      used: true,
    }, { ignoreDuplicates: true })

    return NextResponse.json({
      ok: true,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
