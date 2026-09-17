import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { requireInspectionApproval } from '@/shared/lib/supabase/authorization'

const schema = z.object({ action: z.enum(['approve', 'reject']), reason: z.string().trim().optional() })

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try {
    const supabase = createServerSupabaseClient()
    const { user, tenantId } = await requireInspectionApproval(supabase)
    const { data: change, error } = await supabase.from('inspection_change_requests').select('*').eq('id', params.id).eq('tenant_id', tenantId).eq('status', 'pending').single()
    if (error || !change) throw new Error('Solicitação de alteração pendente não encontrada.')
    const status = parsed.data.action === 'approve' ? 'approved' : 'rejected'
    const { error: decisionError } = await supabase.from('inspection_change_requests').update({ status, approved_by: user.id, rejection_reason: parsed.data.reason ?? null, decided_at: new Date().toISOString() }).eq('id', change.id)
    if (decisionError) throw decisionError
    if (status === 'approved') {
      const { error: updateError } = await supabase.from('inspections').update({ ...change.proposed_data, updated_by: user.id }).eq('id', change.inspection_id).eq('tenant_id', tenantId)
      if (updateError) throw updateError
    }
    await supabase.rpc('log_audit', { p_action: `inspection_change_${status}`, p_entity: 'inspections', p_entity_id: change.inspection_id, p_metadata: { request_id: change.id, requested_by: change.requested_by, approved_by: user.id, previous_data: change.previous_data, proposed_data: change.proposed_data, rejection_reason: parsed.data.reason ?? null } })
    return NextResponse.json({ success: true, status })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}