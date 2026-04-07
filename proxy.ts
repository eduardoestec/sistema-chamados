import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Deixa passar: a própria página de login
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  // Protege apenas rotas /admin
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Cria uma resposta base para poder repassar cookies atualizados
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Propaga os cookies atualizados tanto na request quanto na response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() valida o token junto ao servidor do Supabase Auth (não usa cache)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  // Intercepta /admin e todos os sub-caminhos: /admin/salas, /admin/chamado/[id], etc.
  matcher: ['/admin', '/admin/:path*'],
}
