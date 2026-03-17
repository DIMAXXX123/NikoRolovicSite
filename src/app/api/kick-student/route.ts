import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCallerProfile, isValidUUID } from '@/lib/api-auth'

// Rate limiting: Consider adding middleware-level rate limiting (e.g., 5 req/min per admin)

export async function POST(request: Request) {
  try {
    const caller = await getCallerProfile()
    if (!caller || !['admin', 'creator'].includes(caller.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body = await request.json()
    const { profileId, firstName, lastName, classNumber, sectionNumber } = body

    // Validate inputs
    if (profileId && (typeof profileId !== 'string' || !isValidUUID(profileId))) {
      return NextResponse.json({ error: 'Invalid profileId' }, { status: 400 })
    }
    if (firstName && typeof firstName !== 'string') {
      return NextResponse.json({ error: 'Invalid firstName' }, { status: 400 })
    }
    if (lastName && typeof lastName !== 'string') {
      return NextResponse.json({ error: 'Invalid lastName' }, { status: 400 })
    }

    if (!profileId && !firstName && !lastName) {
      return NextResponse.json({ error: 'Must provide profileId or name' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // If we have a profileId, delete profile + auth user
    if (profileId) {
      await supabase.from('profiles').delete().eq('id', profileId)
      await supabase.auth.admin.deleteUser(profileId)
    }

    // Also delete from verified_students by name+class match
    if (firstName && lastName) {
      let query = supabase
        .from('verified_students')
        .delete()
        .eq('first_name', firstName)
        .eq('last_name', lastName)

      if (classNumber) query = query.eq('class_number', classNumber)
      if (sectionNumber) query = query.eq('section_number', sectionNumber)

      await query
    }

    // If no profileId but we have name, find profile by name and delete
    if (!profileId && firstName && lastName) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('first_name', firstName)
        .eq('last_name', lastName)

      if (profiles) {
        for (const p of profiles) {
          await supabase.from('profiles').delete().eq('id', p.id)
          await supabase.auth.admin.deleteUser(p.id)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
