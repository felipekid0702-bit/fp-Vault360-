import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

const schema = z.object({
  user_id: z.string().uuid(),
  competency_id: z.string().uuid(),
  issued_at: z.string().date(),
  expires_at: z.string().date().optional(),
  document_id: z.string().uuid().optional(),
})

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from('user_competencies').select('*, competency:competency_catalog(code, name), user:users(full_name)').order('expires_at')
    if (error) throw error
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try {
    const supabase = createServerSupabaseClient()
    const { data: auth } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', auth.user?.id ?? '').single()
    if (!profile?.tenant_id) throw new Error('Usuário não possui tenant')
    const { data: competence, error } = await supabase.from('user_competencies').insert({ ...parsed.data, tenant_id: profile.tenant_id, issuer_user_id: auth.user?.id }).select().single()
    if (error) throw error
    return NextResponse.json({ data: competence }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
