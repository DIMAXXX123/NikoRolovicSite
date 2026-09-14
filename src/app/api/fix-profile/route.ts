import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { parseBody } from '@/lib/api-validation'
import { adminSecretMatches } from '@/lib/admin-secret'

// SECURITY NOTES:
// - Protected by the ADMIN_SECRET env variable, compared in constant time.
// - Rate limited through the shared counter (admin-only maintenance endpoint).
// - Uses service role key to bypass RLS for profile repair operations.
// - Supabase handles all password hashing (bcrypt) server-side.

const FixProfileSchema = z.object({ secret: z.string().min(1).max(256) })

export async function POST(request: Request) {
  try {
    const rate = await checkRateLimit(`fix-profile:${clientIp(request)}`, 5, 60_000)
    if (rate.limited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
      )
    }

    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Server configuration error: ADMIN_SECRET not set' }, { status: 500 })
    }

    const parsed = await parseBody(request, FixProfileSchema)
    if (!parsed.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!adminSecretMatches(parsed.data.secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Get all auth users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      return NextResponse.json({ error: 'Failed to list users' }, { status: 500 })
    }

    const results = []

    for (const user of users) {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!existingProfile) {
        // Get user metadata
        const meta = user.user_metadata || {}
        const email = user.email || ''

        // Try to find in verified_students for class info
        const { data: student } = await supabase
          .from('verified_students')
          .select('*')
          .eq('email', email)
          .maybeSingle()

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
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
