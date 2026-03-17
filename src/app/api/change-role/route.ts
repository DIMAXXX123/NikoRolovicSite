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

    // Update role
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
