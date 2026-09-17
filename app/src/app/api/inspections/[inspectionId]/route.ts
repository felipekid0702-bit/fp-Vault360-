import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { getAuthenticatedTenant } from '@/shared/lib/supabase/tenant'

const editSchema = z.object({
  notes: z.string().optional(),
  inspection_location: z.string().trim().min(1).optional(),
  next_due_date: z.string().date().optional(),
  result: z.enum(['approved', 'approved_with_restriction', 'rejected']).optional(),
  verdict: z.enum(['fit', 'unfit']).optional(),
})


export async function PATCH(request: NextRequest, { params }: { params: { inspectionId: string } }) {
  const parsed = editSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  try {
    const supabase = createServerSupabaseClient()
    const { user, tenantId } = await getAuthenticatedTenant(supabase)
    const { data: inspection, error } = await supabase.from('inspections').select('id, tenant_id, result, verdict, notes, inspection_location, next_due_date').eq('id', params.inspectionId).eq('tenant_id', tenantId).single()
    if (error || !inspection) throw new Error('Inspeção não encontrada.')

    const proposed = parsed.data
    const changesStatus = proposed.result !== undefined || proposed.verdict !== undefined
    if (changesStatus) {
      const { data, error: requestError } = await supabase.from('inspection_change_requests').insert({
        tenant_id: tenantId,
        inspection_id: inspection.id,
        requested_by: user.id,
        previous_data: { result: inspection.result, verdict: inspection.verdict },
        proposed_data: proposed,
      }).select().single()
      if (requestError) throw requestError
      await supabase.rpc('log_audit', { p_action: 'inspection_change_requested', p_entity: 'inspections', p_entity_id: inspection.id, p_metadata: { request_id: data.id, previous_data: { result: inspection.result, verdict: inspection.verdict }, proposed_data: proposed } })
      return NextResponse.json({ data, approvalRequired: true }, { status: 202 })
    }

    const { data, error: updateError } = await supabase.from('inspections').update({ ...proposed, updated_by: user.id }).eq('id', inspection.id).eq('tenant_id', tenantId).select().single()
    if (updateError) throw updateError
    await supabase.rpc('log_audit', { p_action: 'inspection_updated', p_entity: 'inspections', p_entity_id: inspection.id, p_metadata: { previous_data: inspection, proposed_data: proposed } })
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

