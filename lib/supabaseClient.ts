import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import type { CookieMethodsServer } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Cliente legado (usado nos componentes existentes)
export const supabase = createClient(url, key)

// Cliente para Client Components (mantém sessão via cookies automaticamente)
export function createSupabaseBrowser() {
  return createBrowserClient(url, key)
}

// Cliente para Server Components / Route Handlers (requer cookies da request/response)
export function createSupabaseServer(cookies: CookieMethodsServer) {
  return createServerClient(url, key, { cookies })
}
