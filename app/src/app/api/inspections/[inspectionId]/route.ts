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
  items: z.array(z.object({
    id: z.string().uuid().optional(),
    checklist_item_id: z.string().uuid(),
    status: z.enum(['ok', 'nok', 'na']),
    classification: z.enum(['C', 'B', 'AV', 'AR', 'R']).nullable(),
    observation: z.string().optional(),
    action_required: z.string().optional(),
  })).optional(),
})

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

export async function PATCH(request: NextRequest, { params }: { params: { inspectionId: string } }) {
  const parsed = editSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  try {
    const supabase = createServerSupabaseClient()
    const { user, tenantId } = await getAuthenticatedTenant(supabase)
    const { data: inspection, error } = await supabase.from('inspections').select('id, tenant_id, result, verdict, notes, inspection_location, next_due_date').eq('id', params.inspectionId).eq('tenant_id', tenantId).single()
    if (error || !inspection) throw new Error('Inspeção não encontrada.')

    const proposed = parsed.data
    const { items, ...inspectionData } = proposed
    const { data: currentItems, error: itemsError } = await supabase.from('inspection_items_result').select('id, checklist_item_id, status, classification, observation, action_required').eq('inspection_id', inspection.id)
    if (itemsError) throw itemsError
    const normalizedCurrentItems = (currentItems ?? []).map(({ id, ...item }) => item)
    const normalizedProposedItems = items?.map(({ id, ...item }) => item)
    const itemsChanged = normalizedProposedItems && JSON.stringify(normalizedProposedItems) !== JSON.stringify(normalizedCurrentItems)
    const changesStatus = proposed.result !== undefined || proposed.verdict !== undefined || Boolean(itemsChanged)
    const previousData = { ...inspection, items: normalizedCurrentItems }
    const proposedData = { ...inspectionData, ...(normalizedProposedItems ? { items: normalizedProposedItems } : {}) }
    const fieldChanges = buildFieldChanges(previousData, proposedData)
    const actorProfile = await resolveUserProfile(supabase, user.id)
    if (changesStatus) {
      const { data, error: requestError } = await supabase.from('inspection_change_requests').insert({
        tenant_id: tenantId,
        inspection_id: inspection.id,
        requested_by: user.id,
        previous_data: previousData,
        proposed_data: proposedData,
      }).select().single()
      if (requestError) throw requestError
      await supabase.rpc('log_audit', { p_action: 'inspection_change_requested', p_entity: 'inspections', p_entity_id: inspection.id, p_metadata: { actor: { user_id: user.id, profile: actorProfile, timestamp: new Date().toISOString() }, field_changes: fieldChanges, previous_data: previousData, proposed_data: proposedData, request_id: data.id } })
      return NextResponse.json({ data, approvalRequired: true }, { status: 202 })
    }

    const { data, error: updateError } = await supabase.from('inspections').update({ ...inspectionData, updated_by: user.id }).eq('id', inspection.id).eq('tenant_id', tenantId).select().single()
    if (updateError) throw updateError
    if (items) {
      for (const item of items) {
        const { id, ...itemData } = item
        if (!id) throw new Error('Item de inspeção inválido.')
        const { error: itemUpdateError } = await supabase.from('inspection_items_result').update(itemData).eq('id', id).eq('inspection_id', inspection.id)
        if (itemUpdateError) throw itemUpdateError
      }
    }
    await supabase.rpc('log_audit', { p_action: 'inspection_updated', p_entity: 'inspections', p_entity_id: inspection.id, p_metadata: { actor: { user_id: user.id, profile: actorProfile, timestamp: new Date().toISOString() }, field_changes: fieldChanges, previous_data: previousData, proposed_data: { ...inspectionData, ...(items ? { items } : {}) } } })
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

