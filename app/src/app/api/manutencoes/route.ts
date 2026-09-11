import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { requirePermission } from '@/shared/lib/supabase/authorization'

const schema = z.object({
  equipment_id: z.string().uuid(),
  inspection_id: z.string().uuid().optional(),
  maintenance_type: z.enum(['preventive', 'corrective', 'repair', 'cleaning', 'reinspection']),
  description: z.string().trim().min(1),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
  performed_by: z.string().uuid().optional(),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  evidence_path: z.string().trim().min(1).optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    let query = supabase.from('maintenance_records').select('*, equipment(model, serial_number)').order('created_at', { ascending: false })
    const equipmentId = new URL(request.url).searchParams.get('equipmentId')
    if (equipmentId) query = query.eq('equipment_id', equipmentId)
    const { data, error } = await query
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
    const { user, tenantId } = await requirePermission(supabase, 'equipment:update')
    const { data: equipment } = await supabase.from('equipment').select('id').eq('id', parsed.data.equipment_id).eq('tenant_id', tenantId).single()
    if (!equipment) throw new Error('Equipamento não encontrado no tenant atual.')
    const { data, error } = await supabase.from('maintenance_records').insert({ ...parsed.data, tenant_id: tenantId, created_by: user.id, performed_by: user.id }).select().single()
    if (error) throw error
    if (parsed.data.maintenance_type === 'repair') {
      const { error: quarantineError } = await supabase
        .from('quarantine_cases')
        .update({ status: 'repair', analysis_notes: parsed.data.description })
        .eq('equipment_id', parsed.data.equipment_id)
        .eq('tenant_id', tenantId)
        .in('status', ['quarantined', 'under_analysis'])
      if (quarantineError) throw quarantineError
    }
    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
