import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { requirePermission } from '@/shared/lib/supabase/authorization'

const schema = z.object({
  equipment_id: z.string().uuid(),
  inspection_id: z.string().uuid().optional(),
  reason: z.string().trim().min(1),
  status: z.enum(['quarantined', 'under_analysis', 'repair']).optional(),
  analysis_notes: z.string().optional(),
  decision: z.enum(['repair', 'release', 'discard']).optional(),
})

const transitionSchema = z.object({
  status: z.enum(['under_analysis', 'repair', 'released', 'discarded']),
  analysis_notes: z.string().trim().min(1),
  decision: z.enum(['repair', 'release', 'discard']).optional(),
  reinspection_id: z.string().uuid().optional(),
})

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from('quarantine_cases').select('*, equipment(model, serial_number)').order('opened_at', { ascending: false })
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
    const { data, error } = await supabase.from('quarantine_cases').insert({ ...parsed.data, tenant_id: tenantId, opened_by: user.id }).select().single()
    if (error) throw error
    const { error: equipmentError } = await supabase.from('equipment').update({ status: 'quarantine' }).eq('id', parsed.data.equipment_id).eq('tenant_id', tenantId)
    if (equipmentError) throw equipmentError
    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

}

export async function PATCH(request: NextRequest) {
  const caseId = new URL(request.url).searchParams.get('caseId')
  const parsed = transitionSchema.safeParse(await request.json())
  if (!caseId) return NextResponse.json({ error: 'caseId é obrigatório.' }, { status: 422 })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try {
    const supabase = createServerSupabaseClient()
    const { user, tenantId } = await requirePermission(supabase, 'equipment:update')
    const { data: quarantineCase, error: caseError } = await supabase
      .from('quarantine_cases')
      .select('id, equipment_id')
      .eq('id', caseId)
      .eq('tenant_id', tenantId)
      .single()
    if (caseError) throw caseError
    if (parsed.data.status === 'released') {
      if (!parsed.data.reinspection_id) throw new Error('Liberação exige reinspeção aprovada.')
      const { data: reinspection, error: reinspectionError } = await supabase
        .from('inspections')
        .select('id, equipment_id, result, verdict')
        .eq('id', parsed.data.reinspection_id)
        .eq('tenant_id', tenantId)
        .single()
      if (reinspectionError) throw reinspectionError
      if (reinspection.equipment_id !== quarantineCase.equipment_id || reinspection.result !== 'approved' || reinspection.verdict !== 'fit') {
        throw new Error('A reinspeção precisa ser do equipamento e estar APTO.')
      }
    }
    const { data, error } = await supabase
      .from('quarantine_cases')
      .update({
        status: parsed.data.status,
        analysis_notes: parsed.data.analysis_notes,
        decision: parsed.data.decision ?? null,
        closed_at: ['released', 'discarded'].includes(parsed.data.status) ? new Date().toISOString() : null,
        closed_by: ['released', 'discarded'].includes(parsed.data.status) ? user.id : null,
      })
      .eq('id', caseId)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    const nextStatus = parsed.data.status === 'released' ? 'active' : parsed.data.status === 'discarded' ? 'retired' : 'quarantine'
    const { error: equipmentError } = await supabase.from('equipment').update({ status: nextStatus }).eq('id', quarantineCase.equipment_id).eq('tenant_id', tenantId)
    if (equipmentError) throw equipmentError
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
