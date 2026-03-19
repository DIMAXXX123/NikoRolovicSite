import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCallerProfile } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'

// Admin endpoint — reset user password via service_role
// Protected by session-based admin/creator role check
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rateLimitError = checkRateLimit(`admin-reset-pw:${ip}`, 3, 60_000)
  if (rateLimitError) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const caller = await getCallerProfile()
  if (!caller || !['admin', 'creator'].includes(caller.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { email, newPassword } = await req.json()

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
