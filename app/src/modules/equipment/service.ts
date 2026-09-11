import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import type { Equipment, EquipmentInput, EquipmentStatus } from './types'

// Toda a lógica de acesso a dados fica isolada aqui. RLS garante o isolamento
// por tenant no banco — este serviço nunca precisa (nem deve) filtrar por
// tenant_id manualmente, o Postgres já faz isso.

export async function listEquipment(filters?: { status?: EquipmentStatus; search?: string }) {
  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('equipment')
    .select('*, manufacturer:manufacturers(name), category:equipment_categories(name)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.search) {
    query = query.or(`model.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%,internal_code.ilike.%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getEquipmentById(id: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
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
  if (error) throw error
  return data
}

export async function createEquipment(input: EquipmentInput) {
  const supabase = createServerSupabaseClient()
  const { data: userData } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('equipment')
    .insert({ ...input, created_by: userData.user?.id, updated_by: userData.user?.id })
    .select()
    .single()

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
  const { data: userData } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('equipment')
    .update({ ...input, updated_by: userData.user?.id })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Equipment
}

export async function softDeleteEquipment(id: string) {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('equipment')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
