import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROFILE_COMPLETE_COOKIE = 'pc'

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const publicPaths = ['/login', '/auth/callback', '/auth/reset-password', '/disclaimer', '/privacy']
  const isPublicPath = publicPaths.some(p => pathname.startsWith(p))

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/discover'
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/discover'
    return NextResponse.redirect(url)
  }

  // Profile completeness gate — use a cookie to avoid a DB call on every request
  if (user && !isPublicPath && pathname !== '/profile') {
    const cached = request.cookies.get(PROFILE_COMPLETE_COOKIE)?.value

    if (cached !== '1') {
      // Cookie missing or expired — verify against DB once, then cache result
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, photo_url, phone')
        .eq('id', user.id)
        .single()

      const isComplete = !!(profile?.display_name && profile?.photo_url && profile?.phone)

      if (!isComplete) {
        const url = request.nextUrl.clone()
        url.pathname = '/profile'
        return NextResponse.redirect(url)
      }

      // Cache for 24 hours so we don't hit the DB again
      supabaseResponse.cookies.set(PROFILE_COMPLETE_COOKIE, '1', {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      })
    }
  }

  return supabaseResponse
}
