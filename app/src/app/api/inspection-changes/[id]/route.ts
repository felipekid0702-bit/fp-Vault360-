import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { requireInspectionApproval } from '@/shared/lib/supabase/authorization'

const schema = z.object({ action: z.enum(['approve', 'reject']), reason: z.string().trim().optional() })

function buildFieldChanges(previous: Record<string, any>, next: Record<string, any>) {
  const changes: Array<{ field: string; old_value: unknown; new_value: unknown }> = []
  const keys = Array.from(new Set([...Object.keys(previous), ...Object.keys(next)]))
  for (const key of keys) {
    const oldValue = previous[key]
    const newValue = next[key]
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({ field: key, old_value: oldValue, new_value: newValue })
    }
  }
  return changes
}

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
      const { items, ...inspectionData } = change.proposed_data as { items?: Array<{ checklist_item_id: string; status: string; classification: string | null; observation?: string; action_required?: string }>; [key: string]: unknown }
      const { error: updateError } = await supabase.from('inspections').update({ ...inspectionData, updated_by: user.id }).eq('id', change.inspection_id).eq('tenant_id', tenantId)
      if (updateError) throw updateError
      for (const item of items ?? []) {
        const { error: itemError } = await supabase.from('inspection_items_result').update({ status: item.status, classification: item.classification, observation: item.observation, action_required: item.action_required }).eq('inspection_id', change.inspection_id).eq('checklist_item_id', item.checklist_item_id)
        if (itemError) throw itemError
      }
    }
    const fieldChanges = buildFieldChanges(change.previous_data as Record<string, any>, change.proposed_data as Record<string, any>)
    await supabase.rpc('log_audit', { p_action: `inspection_change_${status}`, p_entity: 'inspections', p_entity_id: change.inspection_id, p_metadata: { request_id: change.id, requested_by: change.requested_by, approved_by: user.id, user_profile: 'master_or_superior', decision_at: new Date().toISOString(), field_changes: fieldChanges, previous_data: change.previous_data, proposed_data: change.proposed_data, rejection_reason: parsed.data.reason ?? null } })
    return NextResponse.json({ success: true, status })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}