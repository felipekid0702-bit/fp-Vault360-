import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { getAuthenticatedTenant } from '@/shared/lib/supabase/tenant'
import { requirePermission } from '@/shared/lib/supabase/authorization'

export type ServiceStatus = 'received' | 'in_inspection' | 'in_maintenance' | 'completed' | 'delivered' | 'cancelled'

export async function listServices(clientId?: string) {
  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('services')
    .select('*, client:clients(id, name)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  const { data, error } = await query
  if (error?.code === 'PGRST205' || error?.code === '42P01') {
    console.error('[FP Vault360] Migration 015 ainda não aplicada; serviços indisponíveis até a migração.', error)
    return []
  }
  if (error) throw error
  return data ?? []
}

export async function createService(input: {
  client_id: string
  work_order: string
  requested_at?: string
  received_at?: string
  status?: ServiceStatus
  notes?: string
}) {
  const supabase = createServerSupabaseClient()
  const { user, tenantId } = await requirePermission(supabase, 'services:create')
  const { data, error } = await supabase.from('services').insert({
    ...input,
    tenant_id: tenantId,
    created_by: user.id,
    updated_by: user.id,
  }).select('*, client:clients(id, name)').single()
  if (error) throw error
  await supabase.rpc('log_audit', {
    p_action: 'service_created',
    p_entity: 'services',
    p_entity_id: data.id,
    p_metadata: { work_order: input.work_order, client_id: input.client_id },
  })
  return data
}

export async function updateService(id: string, input: Partial<Parameters<typeof createService>[0]>) {
  const supabase = createServerSupabaseClient()
  const { user, tenantId } = await requirePermission(supabase, 'services:update')
  const { data, error } = await supabase.from('services').update({ ...input, updated_by: user.id }).eq('id', id).eq('tenant_id', tenantId).select('*, client:clients(id, name)').single()
  if (error) throw error
  return data
}

export async function softDeleteService(id: string) {
  const supabase = createServerSupabaseClient()
  const { user, tenantId } = await requirePermission(supabase, 'services:delete')
  const { error } = await supabase.from('services').update({ deleted_at: new Date().toISOString(), updated_by: user.id }).eq('id', id).eq('tenant_id', tenantId)
  if (error) throw error
}
