import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

export async function listKits() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('kits')
    .select('*, items:kit_items(equipment_id, equipment:equipment(model, serial_number, status))')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createKit(input: { name: string; code?: string; category?: string; parent_equipment_id?: string; responsible_user_id?: string; location_id?: string; equipment_ids?: string[] }) {
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', auth.user?.id ?? '').single()
  if (!profile?.tenant_id) throw new Error('Usuário não possui tenant')
  const { equipment_ids, ...kitInput } = input
  const { data: kit, error } = await supabase.from('kits').insert({ ...kitInput, tenant_id: profile.tenant_id, created_by: auth.user?.id, updated_by: auth.user?.id }).select().single()
  if (error) throw error
  if (equipment_ids?.length) {
    const { error: itemsError } = await supabase.from('kit_items').insert(equipment_ids.map((equipment_id) => ({ kit_id: kit.id, equipment_id })))
    if (itemsError) throw itemsError
  }
  return kit
}
