import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import type { RegisterRopeCutInput, RetireRopeInput } from './types'

export async function getRopeDetails(equipmentId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('rope_details')
    .select('*, equipment(model, serial_number, status)')
    .eq('equipment_id', equipmentId)
    .single()
  if (error) throw error
  return data
}

export async function listRopeUsageHistory(equipmentId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('rope_usage_history')
    .select('*')
    .eq('equipment_id', equipmentId)
    .order('occurred_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listActiveRopes(filters?: { minWearPercent?: number }) {
  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('rope_details')
    .select('*, equipment(model, serial_number, status, internal_code)')
    .eq('retired', false)
    .order('wear_percent', { ascending: false })

  if (filters?.minWearPercent) query = query.gte('wear_percent', filters.minWearPercent)

  const { data, error } = await query
  if (error) throw error
  return data
}

// O trigger `fn_apply_rope_cut()` no banco já atualiza o comprimento atual e
// grava o evento em rope_usage_history automaticamente — este serviço apenas
// insere o corte, sem duplicar a lógica de recálculo.
export async function registerRopeCut(input: RegisterRopeCutInput) {
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('rope_cuts')
    .insert({
      equipment_id: input.equipment_id,
      cut_length_m: input.cut_length_m,
      reason: input.reason,
      performed_by: auth.user?.id,
    })
    .select()
    .single()

  if (error) throw error

  await supabase.rpc('log_audit', {
    p_action: 'rope_cut_registered',
    p_entity: 'equipment',
    p_entity_id: input.equipment_id,
    p_metadata: { cut_length_m: input.cut_length_m },
  })

  return data
}

export async function retireRope(input: RetireRopeInput) {
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()

  const { error: ropeError } = await supabase
    .from('rope_details')
    .update({ retired: true, retired_at: new Date().toISOString(), retired_reason: input.reason })
    .eq('equipment_id', input.equipment_id)
  if (ropeError) throw ropeError

  const { error: equipmentError } = await supabase
    .from('equipment')
    .update({ status: 'retired', updated_by: auth.user?.id })
    .eq('id', input.equipment_id)
  if (equipmentError) throw equipmentError

  await supabase.from('rope_usage_history').insert({
    equipment_id: input.equipment_id,
    event_type: 'retirement',
    description: input.reason,
    recorded_by: auth.user?.id,
  })

  await supabase.rpc('log_audit', {
    p_action: 'rope_retired',
    p_entity: 'equipment',
    p_entity_id: input.equipment_id,
    p_metadata: { reason: input.reason },
  })
}
