import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// IMPORTANTE: nunca usar a service_role key no client. Este helper roda
// exclusivamente em Server Components / Route Handlers / Server Actions,
// respeitando sempre RLS através da sessão do usuário autenticado.
export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Uso restrito: operações administrativas que precisam contornar RLS
// (ex.: provisionamento de tenant chamado pelo Super Master).
// Nunca expor esta chave ao bundle do cliente — apenas em Route Handlers.
export function createServiceRoleClient() {
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
