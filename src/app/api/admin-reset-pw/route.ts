import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Temporary admin endpoint — reset user password via service_role
// Protected by admin secret (Telegram admin ID)
export async function POST(req: NextRequest) {
  const { email, newPassword, adminSecret } = await req.json()

  // Only allow Dima's telegram ID as secret
  if (adminSecret !== '6829550617') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find user by email
  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers()
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

  const user = users.find(u => u.email === email.toLowerCase())
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Reset password
  const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
    email_confirm: true,
  })

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, userId: user.id })
}
