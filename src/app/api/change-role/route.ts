import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ADMIN_ROLES, getCallerProfile, hasRole } from '@/lib/api-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { parseBody, uuidSchema } from '@/lib/api-validation'

const ChangeRoleSchema = z.object({
  userId: uuidSchema,
  newRole: z.enum(['student', 'moderator', 'admin', 'creator']),
})

export async function POST(request: Request) {
  try {
    const caller = await getCallerProfile()
    if (!hasRole(caller, ADMIN_ROLES)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const rate = await checkRateLimit(`change-role:${clientIp(request)}`, 20, 60_000)
    if (rate.limited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
      )
    }

    const parsed = await parseBody(request, ChangeRoleSchema)
    if (!parsed.ok) return parsed.response

    const { userId, newRole } = parsed.data
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()

    if (error) {
      return NextResponse.json({ error: 'Failed to update role' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, data })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
