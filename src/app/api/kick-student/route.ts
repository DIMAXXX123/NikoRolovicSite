import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceKey) {
    return NextResponse.json({ error: 'No service key configured' }, { status: 500 })
  }

  const { profileId, firstName, lastName, classNumber, sectionNumber } = await request.json()

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
}
