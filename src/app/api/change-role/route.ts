import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCallerProfile, isValidUUID } from '@/lib/api-auth'

// Rate limiting: Consider adding middleware-level rate limiting (e.g., 10 req/min per user)

export async function POST(request: Request) {
  try {
    const caller = await getCallerProfile()
    if (!caller || !['admin', 'creator'].includes(caller.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, newRole } = body

    if (!userId || typeof userId !== 'string' || !isValidUUID(userId)) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
    }

    const VALID_ROLES = ['student', 'moderator', 'admin', 'creator']

    if (!newRole || typeof newRole !== 'string' || !VALID_ROLES.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role. Must be one of: ' + VALID_ROLES.join(', ') }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

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
