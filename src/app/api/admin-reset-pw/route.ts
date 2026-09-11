import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ADMIN_ROLES, getCallerProfile, hasRole } from '@/lib/api-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { emailSchema, parseBody, passwordSchema } from '@/lib/api-validation'

// Admin endpoint — reset user password via service_role
// Protected by session-based admin/creator role check
const ResetSchema = z.object({
  email: emailSchema,
  newPassword: passwordSchema,
})

export async function POST(req: NextRequest) {
  const rate = await checkRateLimit(`admin-reset-pw:${clientIp(req)}`, 3, 60_000)
  if (rate.limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
    )
  }

  const caller = await getCallerProfile()
  if (!hasRole(caller, ADMIN_ROLES)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const parsed = await parseBody(req, ResetSchema)
  if (!parsed.ok) return parsed.response

  const { email, newPassword } = parsed.data
  const admin = createServiceClient()

  // Find user by email
  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers()
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

  const user = users.find(u => u.email === email)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Reset password
  const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
    email_confirm: true,
  })

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, userId: user.id })
}
