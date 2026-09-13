import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { getAuthenticatedTenant } from '@/shared/lib/supabase/tenant'
import { requirePermission } from '@/shared/lib/supabase/authorization'
import type { Equipment, EquipmentInput, EquipmentStatus } from './types'

function isSchemaNotMigrated(error: { code?: string; message?: string }) {
  return error.code === '42703' || error.code === 'PGRST205' || error.message?.includes('schema cache')
}

function isOwnerStructureMissing(error: { code?: string; message?: string }) {
  return error.code === '42703' && (
    error.message?.includes('owner_type') ||
    error.message?.includes('client_id')
  )
}

// Toda a lógica de acesso a dados fica isolada aqui. RLS garante o isolamento
// por tenant no banco — este serviço nunca precisa (nem deve) filtrar por
// tenant_id manualmente, o Postgres já faz isso.

export async function listEquipment(filters?: { status?: EquipmentStatus; search?: string; ownerType?: 'fp' | 'client'; clientId?: string; manufacturerId?: string; categoryId?: string }) {
  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('equipment')
    .select('*, manufacturer:manufacturers(name), category:equipment_categories(name), client:clients(id, name), service:services(id, work_order, status), inspections(id, result, verdict, performed_at)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .order('performed_at', { referencedTable: 'inspections', ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.ownerType) query = query.eq('owner_type', filters.ownerType)
  if (filters?.clientId) query = query.eq('client_id', filters.clientId)
  if (filters?.manufacturerId) query = query.eq('manufacturer_id', filters.manufacturerId)
  if (filters?.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters?.search) {
    query = query.or(`model.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%,internal_code.ilike.%${filters.search}%`)
  }

  let { data, error } = await query
  if (error && isSchemaNotMigrated(error)) {
    console.error('[FP Vault360] Migration 014 ainda não aplicada; usando estrutura legada de equipamentos.', error)
    if (filters?.ownerType === 'client') return []
    let legacyQuery = supabase
      .from('equipment')
      .select('*, manufacturer:manufacturers(name), category:equipment_categories(name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (filters?.status) legacyQuery = legacyQuery.eq('status', filters.status)
    if (filters?.manufacturerId) legacyQuery = legacyQuery.eq('manufacturer_id', filters.manufacturerId)
    if (filters?.categoryId) legacyQuery = legacyQuery.eq('category_id', filters.categoryId)
    if (filters?.search) {
      legacyQuery = legacyQuery.or(`model.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%,internal_code.ilike.%${filters.search}%`)
    }

    const legacyResult = await legacyQuery
    data = legacyResult.data?.map((item) => ({ ...item, owner_type: 'fp', client_id: null })) ?? null
    error = legacyResult.error
  }
  if (error) throw error
  return data ?? []
}

export async function getEquipmentById(id: string) {
  const supabase = createServerSupabaseClient()
  let { data, error } = await supabase
    .from('equipment')
    .select(`
      *,
      manufacturer:manufacturers(name),
      category:equipment_categories(name),
      photos:equipment_photos(id, storage_path, caption),
      codes:equipment_codes(code_type, code_value),
      inspections(id, type, result, performed_at, next_due_date)
    `)
    .eq('id', id)
    .single()
  if (error && isSchemaNotMigrated(error)) {
    console.error('[FP Vault360] Migration 014 ainda não aplicada; consultando equipamento na estrutura legada.', error)
    const legacyResult = await supabase
      .from('equipment')
      .select(`
        *,
        manufacturer:manufacturers(name),
        category:equipment_categories(name),
        photos:equipment_photos(id, storage_path, caption),
        codes:equipment_codes(code_type, code_value),
        inspections(id, type, result, performed_at, next_due_date)
      `)
      .eq('id', id)
      .single()
    data = legacyResult.data ? { ...legacyResult.data, owner_type: 'fp', client_id: null } : null
    error = legacyResult.error
  }
  if (error) throw error
  return data
}

export async function createEquipment(input: EquipmentInput) {
  const supabase = createServerSupabaseClient()
  const { user, tenantId } = await getAuthenticatedTenant(supabase)

  let { data, error } = await supabase
    .from('equipment')
    .insert({ ...input, tenant_id: tenantId, created_by: user.id, updated_by: user.id })
    .select()
    .single()

  if (error && isOwnerStructureMissing(error) && input.owner_type === 'fp' && !input.client_id) {
    console.error('[FP Vault360] Migration 014 ainda não aplicada; cadastrando equipamento FP na estrutura legada.', error)
    const { owner_type: _ownerType, client_id: _clientId, service_id: _serviceId, ...legacyInput } = input
    const legacyResult = await supabase
      .from('equipment')
      .insert({ ...legacyInput, tenant_id: tenantId, created_by: user.id, updated_by: user.id })
      .select()
      .single()
    data = legacyResult.data
    error = legacyResult.error
  }

  if (error) throw error

  await supabase.rpc('log_audit', {
    p_action: 'equipment_created',
    p_entity: 'equipment',
    p_entity_id: data.id,
    p_metadata: { model: input.model },
  })

  return data as Equipment
}

export async function updateEquipment(id: string, input: Partial<EquipmentInput>) {
  const supabase = createServerSupabaseClient()
  const { user } = await getAuthenticatedTenant(supabase)

  let { data, error } = await supabase
    .from('equipment')
    .update({ ...input, updated_by: user.id })
    .eq('id', id)
    .select()
    .single()

  if (error && isOwnerStructureMissing(error) && input.owner_type === 'fp' && !input.client_id) {
    console.error('[FP Vault360] Migration 014 ainda não aplicada; atualizando equipamento na estrutura legada.', error)
    const { owner_type: _ownerType, client_id: _clientId, service_id: _serviceId, ...legacyInput } = input
    const legacyResult = await supabase
      .from('equipment')
      .update({ ...legacyInput, updated_by: user.id })
      .eq('id', id)
      .select()
      .single()
    data = legacyResult.data
    error = legacyResult.error
  }

  if (error) throw error
  await supabase.rpc('log_audit', { p_action: 'equipment_updated', p_entity: 'equipment', p_entity_id: id, p_metadata: input })
  return data as Equipment
}

export async function softDeleteEquipment(id: string) {
  const supabase = createServerSupabaseClient()
  const { user, tenantId } = await requirePermission(supabase, 'equipment:delete')
  const { error } = await supabase
    .from('equipment')
    .update({ deleted_at: new Date().toISOString(), updated_by: user.id })
    .eq('id', id)
    .eq('tenant_id', tenantId)
  if (error) throw error
  await supabase.rpc('log_audit', { p_action: 'equipment_deleted', p_entity: 'equipment', p_entity_id: id })
}
