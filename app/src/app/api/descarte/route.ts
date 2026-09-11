import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { requirePermission } from '@/shared/lib/supabase/authorization'

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
    const { user, tenantId } = await requirePermission(supabase, 'equipment:delete')
    const { data: equipment } = await supabase.from('equipment').select('id').eq('id', parsed.data.equipment_id).eq('tenant_id', tenantId).single()
    if (!equipment) throw new Error('Equipamento não encontrado no tenant atual.')
    const { data, error } = await supabase.from('disposal_records').insert({ ...parsed.data, tenant_id: tenantId, disposed_by: user.id }).select().single()
    if (error) throw error
    const { error: equipmentError } = await supabase.from('equipment').update({ status: 'retired' }).eq('id', parsed.data.equipment_id).eq('tenant_id', tenantId)
    if (equipmentError) throw equipmentError
    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
