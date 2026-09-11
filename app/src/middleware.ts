import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isPasswordRoute = request.nextUrl.pathname.startsWith('/trocar-senha')
  const isBootstrapRoute = request.nextUrl.pathname === '/api/admin/bootstrap'
  const isBrandAsset = request.nextUrl.pathname.startsWith('/brand/')
  const isPublicRoute = isAuthRoute || isPasswordRoute || isBootstrapRoute || isBrandAsset || request.nextUrl.pathname.startsWith('/api/public')

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  if (user && !isPasswordRoute && !request.nextUrl.pathname.startsWith('/api/')) {
    const { data: profile } = await supabase.from('users').select('must_change_password').eq('id', user.id).maybeSingle()
    if (profile?.must_change_password) return NextResponse.redirect(new URL('/trocar-senha', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|brand).*)'],
}
