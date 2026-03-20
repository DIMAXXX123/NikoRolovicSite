import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register') ||
                     request.nextUrl.pathname.startsWith('/verify') ||
                     request.nextUrl.pathname.startsWith('/reset-password') ||
                     request.nextUrl.pathname.startsWith('/update-password')

  const isCompleteProfile = request.nextUrl.pathname.startsWith('/complete-profile')

  if (!user && !isAuthPage && !isCompleteProfile && request.nextUrl.pathname !== '/') {
    const url = request.nextUrl.clone()
    // First visit → register, returning user → login
    const hasVisited = request.cookies.get('niko_visited')
    url.pathname = hasVisited ? '/login' : '/register'
    return NextResponse.redirect(url)
  }

  // Don't redirect away from complete-profile — user needs to finish registration
  if (user && isAuthPage && !isCompleteProfile) {
    const url = request.nextUrl.clone()
    url.pathname = '/news'
    return NextResponse.redirect(url)
  }

  // Allow complete-profile for logged-in users (they need to fill in their details)
  if (!user && isCompleteProfile) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Set visited cookie on login/register pages so next time they go to login
  if (isAuthPage && !request.cookies.get('niko_visited')) {
    supabaseResponse.cookies.set('niko_visited', '1', {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      sameSite: 'lax',
    })
  }

  return supabaseResponse
}
