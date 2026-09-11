import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { getAuthenticatedTenant } from '@/shared/lib/supabase/tenant'

function isSchemaNotMigrated(error: { code?: string; message?: string }) {
  return error.code === '42703' || error.code === 'PGRST205' || error.message?.includes('schema cache')
}

export async function listManufacturers(search?: string) {
  const supabase = createServerSupabaseClient()
  let query = supabase.from('manufacturers').select('id, name, country, website, status, notes').is('deleted_at', null).order('name')
  if (search) query = query.ilike('name', `%${search}%`)
  let { data, error } = await query
  if (error && isSchemaNotMigrated(error)) {
    console.error('[FP Vault360] Migration 014 ainda não aplicada; usando campos legados de fabricantes.', error)
    let legacyQuery = supabase.from('manufacturers').select('id, name, country, website').is('deleted_at', null).order('name')
    if (search) legacyQuery = legacyQuery.ilike('name', `%${search}%`)
    const legacyResult = await legacyQuery
    data = legacyResult.data?.map((manufacturer) => ({ ...manufacturer, status: 'active', notes: null })) ?? null
    error = legacyResult.error
  }
  if (error) throw error
  return data ?? []
}

export async function createManufacturer(input: { name: string; website?: string; notes?: string; status?: 'active' | 'inactive' }) {
  const supabase = createServerSupabaseClient()
  const { user, tenantId } = await getAuthenticatedTenant(supabase)
  const { data, error } = await supabase.from('manufacturers').insert({ ...input, tenant_id: tenantId, created_by: user.id, updated_by: user.id }).select().single()
  if (error) throw error
  return data
}

export async function updateManufacturer(id: string, input: { name?: string; website?: string; notes?: string; status?: 'active' | 'inactive' }) {
  const supabase = createServerSupabaseClient()
  const { user } = await getAuthenticatedTenant(supabase)
  const { data, error } = await supabase.from('manufacturers').update({ ...input, updated_by: user.id }).eq('id', id).select().single()
  if (error) throw error
  await supabase.rpc('log_audit', { p_action: 'manufacturer_updated', p_entity: 'manufacturers', p_entity_id: id, p_metadata: input })
  return data
}

export async function softDeleteManufacturer(id: string) {
  const supabase = createServerSupabaseClient()
  const { user } = await getAuthenticatedTenant(supabase)
  const { error } = await supabase.from('manufacturers').update({ deleted_at: new Date().toISOString(), updated_by: user.id }).eq('id', id)
  if (error) throw error
  await supabase.rpc('log_audit', { p_action: 'manufacturer_deleted', p_entity: 'manufacturers', p_entity_id: id })
}

export interface ClientInput {
  name: string
  legal_name?: string
  cnpj?: string
  email?: string
  phone?: string
  primary_contact?: string
  notes?: string
  status?: 'active' | 'inactive'
}

export async function listClients(search?: string) {
  const supabase = createServerSupabaseClient()
  let query = supabase.from('clients').select('*').is('deleted_at', null).order('name')
  if (search) query = query.or(`name.ilike.%${search}%,legal_name.ilike.%${search}%,cnpj.ilike.%${search}%`)
  const { data, error } = await query
  if (error && isSchemaNotMigrated(error)) {
    console.error('[FP Vault360] Migration 014 ainda não aplicada; clientes ficarão indisponíveis até a migração.', error)
    return []
  }
  if (error) throw error
  return data ?? []
}

export async function createClient(input: ClientInput) {
  const supabase = createServerSupabaseClient()
  const { user, tenantId } = await getAuthenticatedTenant(supabase)
  const { data, error } = await supabase.from('clients').insert({ ...input, tenant_id: tenantId, created_by: user.id, updated_by: user.id }).select().single()
  if (error) throw error
  await supabase.rpc('log_audit', { p_action: 'client_created', p_entity: 'clients', p_entity_id: data.id, p_metadata: input })
  return data
}

export async function updateClient(id: string, input: Partial<ClientInput>) {
  const supabase = createServerSupabaseClient()
  const { user } = await getAuthenticatedTenant(supabase)
  const { data, error } = await supabase.from('clients').update({ ...input, updated_by: user.id }).eq('id', id).select().single()
  if (error) throw error
  await supabase.rpc('log_audit', { p_action: 'client_updated', p_entity: 'clients', p_entity_id: id, p_metadata: input })
  return data
}

export async function softDeleteClient(id: string) {
  const supabase = createServerSupabaseClient()
  const { user } = await getAuthenticatedTenant(supabase)
  const { error } = await supabase.from('clients').update({ deleted_at: new Date().toISOString(), updated_by: user.id }).eq('id', id)
  if (error) throw error
  await supabase.rpc('log_audit', { p_action: 'client_deleted', p_entity: 'clients', p_entity_id: id })
}

export async function listCategories() {
  const supabase = createServerSupabaseClient()
  const { tenantId, user } = await getAuthenticatedTenant(supabase)
  const { data, error } = await supabase.from('equipment_categories').select('id, name, code, default_lifespan_months').is('deleted_at', null).order('name')
  if (error) throw error
  const defaults = [
    ['Ascensor', 'ASCENSOR'], ['Cinta Sling - Elemento Textil', 'CINTA-SLING'], ['Cinto', 'CINTO'],
    ['Corda', 'CORDA'], ['Descensor', 'DESCENSOR'], ['Estribo - Elemento Textil', 'ESTRIBO'],
    ['Estropo', 'ESTROPO'], ['Extensor - Elemento Textil', 'EXTENSOR'], ['Fita Anel - Elemento Textil', 'FITA-ANEL'],
    ['Mailon - Conector', 'MAILON'], ['Mosquetão - Conector', 'MOSQUETAO'], ['Polia', 'POLIA'],
    ['Proteção de Corda - Elemento Textil', 'PROTECAO-CORDA'], ['Talabarte', 'TALABARTE'], ['Trava Quedas', 'TRAVA-QUEDAS'],
  ]
  const existingNames = new Set((data ?? []).map((category) => category.name.toLocaleLowerCase('pt-BR')))
  const missing = defaults.filter(([name]) => !existingNames.has(name.toLocaleLowerCase('pt-BR')))
  if (missing.length) {
    const { data: inserted, error: insertError } = await supabase.from('equipment_categories').insert(
      missing.map(([name, code]) => ({ tenant_id: tenantId, name, code, default_lifespan_months: 60, created_by: user.id, updated_by: user.id })),
    ).select('id, name, code, default_lifespan_months')
    if (insertError) throw insertError
    return [...(data ?? []), ...(inserted ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }
  return data ?? []
}

export async function createCategory(input: { name: string; code?: string; default_lifespan_months?: number }) {
  const supabase = createServerSupabaseClient()
  const { user, tenantId } = await getAuthenticatedTenant(supabase)
  const { data, error } = await supabase.from('equipment_categories').insert({ ...input, tenant_id: tenantId, created_by: user.id, updated_by: user.id }).select().single()
  if (error) throw error
  return data
}