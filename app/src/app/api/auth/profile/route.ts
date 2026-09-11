import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  const { data, error } = await supabase.from('users').select('must_change_password, tenant_id, is_super_master').eq('id', auth.user.id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
