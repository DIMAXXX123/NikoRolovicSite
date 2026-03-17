import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  
  if (secret !== 'niko2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!serviceKey) {
    return NextResponse.json({ error: 'No service key configured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Get all auth users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
  
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const results = []

  for (const user of users) {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingProfile) {
      // Get user metadata
      const meta = user.user_metadata || {}
      const email = user.email || ''
      
      // Try to find in verified_students for class info
      const { data: student } = await supabase
        .from('verified_students')
        .select('*')
        .eq('email', email)
        .single()

      const profileData = {
        id: user.id,
        first_name: meta.first_name || student?.first_name || 'Unknown',
        last_name: meta.last_name || student?.last_name || 'Unknown',
        email: email,
        class_number: meta.class_number || student?.class_number || 1,
        section_number: meta.section_number || student?.section_number || 1,
        role: 'student' as string,
      }

      // Make dmitrykokrok admin
      if (email === 'dmitrykokrok@gmail.com') {
        profileData.role = 'admin'
      }

      const { error: insertError } = await supabase
        .from('profiles')
        .insert(profileData)

      results.push({ email, action: 'created', role: profileData.role, error: insertError?.message })
    } else {
      // If it's Dima, make sure he's admin
      if (user.email === 'dmitrykokrok@gmail.com') {
        await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', user.id)
        results.push({ email: user.email, action: 'updated to admin' })
      } else {
        results.push({ email: user.email, action: 'already exists' })
      }
    }
  }

  return NextResponse.json({ ok: true, results })
}
