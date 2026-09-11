import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { getAuthenticatedTenant } from '@/shared/lib/supabase/tenant'

export async function listKits() {
  const supabase = createServerSupabaseClient()
  let { data, error } = await supabase
    .from('kits')
    .select('*, client:clients(id, name), items:kit_items(equipment_id, equipment:equipment(model, serial_number, status))')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error?.code === 'PGRST200' || error?.code === 'PGRST205') {
    console.error('[FP Vault360] Migration 014 ainda não aplicada; listando kits na estrutura legada.', error)
    const legacyResult = await supabase
      .from('kits')
      .select('*, items:kit_items(equipment_id, equipment:equipment(model, serial_number, status))')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    data = legacyResult.data?.map((kit) => ({ ...kit, client: null })) ?? null
    error = legacyResult.error
  }
  if (error) throw error
  return data ?? []
}

export async function createKit(input: { name: string; code?: string; description?: string; client_id?: string; parent_equipment_id?: string; responsible_user_id?: string; location_id?: string; equipment_ids?: string[] }) {
  const supabase = createServerSupabaseClient()
  const { user, tenantId } = await getAuthenticatedTenant(supabase)
  const { equipment_ids, ...kitInput } = input
  const { data: kit, error } = await supabase.from('kits').insert({ ...kitInput, tenant_id: tenantId, created_by: user.id, updated_by: user.id }).select().single()
  if (error) throw error
  if (equipment_ids?.length) {
    const { error: itemsError } = await supabase.from('kit_items').insert(equipment_ids.map((equipment_id) => ({ kit_id: kit.id, equipment_id })))
    if (itemsError) throw itemsError
  }
  return kit
}

export async function updateKit(id: string, input: { name?: string; code?: string; description?: string; client_id?: string; equipment_ids?: string[] }) {
  const supabase = createServerSupabaseClient()
  const { tenantId } = await getAuthenticatedTenant(supabase)
  const { equipment_ids, ...kitInput } = input
  const { data: kit, error } = await supabase.from('kits').update(kitInput).eq('id', id).eq('tenant_id', tenantId).select().single()
  if (error) throw error
  if (equipment_ids) {
    const { error: deleteError } = await supabase.from('kit_items').delete().eq('kit_id', id)
    if (deleteError) throw deleteError
    if (equipment_ids.length) {
      const { error: itemsError } = await supabase.from('kit_items').insert(equipment_ids.map((equipment_id) => ({ kit_id: id, equipment_id })))
      if (itemsError) throw itemsError
    }
  }
  return kit
}

export async function replaceKitEquipment(kitId: string, equipmentIds: string[]) {
  const supabase = createServerSupabaseClient()
  const { tenantId } = await getAuthenticatedTenant(supabase)
  const { data: kit, error: kitError } = await supabase.from('kits').select('id').eq('id', kitId).eq('tenant_id', tenantId).single()
  if (kitError) throw kitError
  if (equipmentIds.length) {
    const { data: equipment, error: equipmentError } = await supabase.from('equipment').select('id').eq('tenant_id', tenantId).in('id', equipmentIds).is('deleted_at', null)
    if (equipmentError) throw equipmentError
    if ((equipment ?? []).length !== equipmentIds.length) throw new Error('Um ou mais equipamentos não pertencem ao tenant atual.')
  }
  const { error: deleteError } = await supabase.from('kit_items').delete().eq('kit_id', kit.id)
  if (deleteError) throw deleteError
  if (equipmentIds.length) {
    const { error } = await supabase.from('kit_items').insert(equipmentIds.map((equipment_id) => ({ kit_id: kit.id, equipment_id })))
    if (error) throw error
  }
  return { kit_id: kit.id, equipment_ids: equipmentIds }
}
