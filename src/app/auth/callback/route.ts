import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    // If recovery flow, redirect to update-password page
    const type = searchParams.get('type')
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/update-password`)
    }

    // Check if user has a complete profile
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, class_number, section_number')
        .eq('id', session.user.id)
        .single()

      const isComplete = profile &&
        profile.first_name &&
        profile.last_name &&
        profile.class_number &&
        profile.section_number

      if (!isComplete) {
        return NextResponse.redirect(`${origin}/complete-profile`)
      }
    }

    return NextResponse.redirect(`${origin}/gallery`)
  }

  return NextResponse.redirect(`${origin}/login`)
}
