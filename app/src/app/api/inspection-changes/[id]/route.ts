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

async function resolveUserProfile(supabase: any, userId: string) {
  const { data: assignments, error } = await supabase
    .from('user_roles')
    .select('roles!inner(code)')
    .eq('user_id', userId)

  if (error) return 'user'

  const codes = (assignments ?? []).flatMap((assignment: any) => {
    const roles = Array.isArray(assignment.roles) ? assignment.roles : assignment.roles ? [assignment.roles] : []
    return roles.map((role: any) => String(role?.code ?? '').toLowerCase())
  })

  if (codes.includes('super_master') || codes.includes('sup_master')) return 'SUPERIOR_MASTER'
  if (codes.some((code: string) => code.startsWith('master'))) return 'MASTER'
  if (codes.some((code: string) => code.includes('submaster') || code.includes('sub_master'))) return 'SUBMASTER'
  return 'USER'
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

    const actorProfile = await resolveUserProfile(supabase, user.id)
    const fieldChanges = buildFieldChanges(change.previous_data as Record<string, any>, change.proposed_data as Record<string, any>)

    if (status === 'approved') {
      const { items, ...inspectionData } = change.proposed_data as { items?: Array<{ checklist_item_id: string; status: string; classification: string | null; observation?: string; action_required?: string }>; [key: string]: unknown }
      const { error: updateError } = await supabase.from('inspections').update({ ...inspectionData, updated_by: user.id }).eq('id', change.inspection_id).eq('tenant_id', tenantId)
      if (updateError) throw updateError
      for (const item of items ?? []) {
        const { error: itemError } = await supabase.from('inspection_items_result').update({ status: item.status, classification: item.classification, observation: item.observation, action_required: item.action_required }).eq('inspection_id', change.inspection_id).eq('checklist_item_id', item.checklist_item_id)
        if (itemError) throw itemError
      }
    }

    if (status === 'rejected') {
      const previousData = change.previous_data as Record<string, any>
      const previousItems = Array.isArray(previousData.items) ? previousData.items : []
      const { items: _ignoredItems, ...inspectionData } = previousData as { items?: Array<any>; [key: string]: unknown }
      const { error: restoreError } = await supabase.from('inspections').update({ ...inspectionData, updated_by: user.id }).eq('id', change.inspection_id).eq('tenant_id', tenantId)
      if (restoreError) throw restoreError

      for (const item of previousItems) {
        const { checklist_item_id, ...itemData } = item as { checklist_item_id?: string; [key: string]: any }
        if (!checklist_item_id) continue
        const { error: restoreItemError } = await supabase.from('inspection_items_result').update(itemData).eq('inspection_id', change.inspection_id).eq('checklist_item_id', checklist_item_id)
        if (restoreItemError) throw restoreItemError
      }
    }

    await supabase.rpc('log_audit', { p_action: `inspection_change_${status}`, p_entity: 'inspections', p_entity_id: change.inspection_id, p_metadata: { actor: { user_id: user.id, profile: actorProfile, timestamp: new Date().toISOString() }, request_id: change.id, requested_by: change.requested_by, approved_by: user.id, decision_at: new Date().toISOString(), field_changes: fieldChanges, previous_data: change.previous_data, proposed_data: change.proposed_data, rejection_reason: parsed.data.reason ?? null } })
    return NextResponse.json({ success: true, status })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}