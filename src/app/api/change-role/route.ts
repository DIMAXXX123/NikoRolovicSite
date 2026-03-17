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

    if (!newRole || typeof newRole !== 'string' || newRole.length > 50) {
      return NextResponse.json({ error: 'Invalid newRole' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // Standard roles go in 'role' column, custom roles stored as 'student' + custom in display
    const standardRoles = ['student', 'moderator', 'admin', 'creator']
    const isStandard = standardRoles.includes(newRole)

    // First try to drop and recreate constraint to allow custom roles
    if (!isStandard) {
      try {
        await supabase.rpc('exec_sql', { query: `ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check` })
        await supabase.rpc('exec_sql', { query: `ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'moderator', 'admin', 'creator', '${newRole.replace(/'/g, "''")}'))` })
      } catch {
        // RPC not available, try direct update anyway
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()

    if (error) {
      if (error.message.includes('profiles_role_check')) {
        return NextResponse.json({
          error: 'Korisnička uloga nije podržana u bazi. Pokreni SQL u Supabase: ALTER TABLE profiles DROP CONSTRAINT profiles_role_check; ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IS NOT NULL);'
        }, { status: 400 })
      }
      return NextResponse.json({ error: 'Failed to update role' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, data })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
