import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { userId, newRole, adminEmail } = await request.json()

    if (!userId || !newRole) {
      return NextResponse.json({ error: 'Missing userId or newRole' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!serviceKey) {
      return NextResponse.json({ error: 'Service key not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // Verify the requester is admin/creator
    if (adminEmail) {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', adminEmail)
        .single()

      if (!adminProfile || !['admin', 'creator'].includes(adminProfile.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Standard roles go in 'role' column, custom roles stored as 'student' + custom in display
    const standardRoles = ['student', 'moderator', 'admin', 'creator']
    const isStandard = standardRoles.includes(newRole)

    // First try to drop and recreate constraint to allow custom roles
    // If that fails, fall back to keeping standard role
    if (!isStandard) {
      // Try to add the custom role to the constraint
      try {
        await supabase.rpc('exec_sql', { query: `ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check` })
        await supabase.rpc('exec_sql', { query: `ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'moderator', 'admin', 'creator', '${newRole.replace(/'/g, "''")}'))` })
      } catch {
        // RPC not available, try direct update anyway
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role: isStandard ? newRole : newRole })
      .eq('id', userId)
      .select()

    if (error) {
      // If constraint error, explain
      if (error.message.includes('profiles_role_check')) {
        return NextResponse.json({ 
          error: 'Korisnička uloga nije podržana u bazi. Pokreni SQL u Supabase: ALTER TABLE profiles DROP CONSTRAINT profiles_role_check; ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IS NOT NULL);' 
        }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
