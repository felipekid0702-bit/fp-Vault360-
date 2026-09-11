import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

const schema = z.object({
  equipment_id: z.string().uuid(),
  quarantine_case_id: z.string().uuid().optional(),
  reason: z.string().trim().min(1),
  evidence_path: z.string().trim().min(1),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try {
    const supabase = createServerSupabaseClient()
    const { data: auth } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', auth.user?.id ?? '').single()
    if (!profile?.tenant_id) throw new Error('Usuário não possui tenant')
    const { data, error } = await supabase.from('disposal_records').insert({ ...parsed.data, tenant_id: profile.tenant_id, disposed_by: auth.user?.id }).select().single()
    if (error) throw error
    const { error: equipmentError } = await supabase.from('equipment').update({ status: 'retired' }).eq('id', parsed.data.equipment_id)
    if (equipmentError) throw equipmentError
    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
