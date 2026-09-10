import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { AUTH_PATHS, PUBLIC_PATHS, pathMatches } from '@/lib/public-paths'

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

  const { pathname } = request.nextUrl
  const isAuthPage = pathMatches(pathname, AUTH_PATHS)
  const isPublicPage = pathMatches(pathname, PUBLIC_PATHS)
  const isCompleteProfile = pathname.startsWith('/complete-profile')

  // Auth guard: anonymous visitors only get the public pages.
  if (!user && !isPublicPage && !isCompleteProfile) {
    const url = request.nextUrl.clone()
    const hasVisited = request.cookies.get('niko_visited')
    url.pathname = hasVisited ? '/login' : '/register'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Don't redirect away from complete-profile — user needs to finish registration
  if (user && isAuthPage && !isCompleteProfile) {
    const url = request.nextUrl.clone()
    url.pathname = '/news'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // complete-profile handles its own auth check — don't interfere

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
