import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceKey) {
    return NextResponse.json({ error: 'No service key configured' }, { status: 500 })
  }

  const { profileId } = await request.json()
  if (!profileId) {
    return NextResponse.json({ error: 'profileId required' }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Delete the profile (RLS bypassed via service role)
  await supabase.from('profiles').delete().eq('id', profileId)

  // Delete the auth user — this invalidates all their sessions
  const { error } = await supabase.auth.admin.deleteUser(profileId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
