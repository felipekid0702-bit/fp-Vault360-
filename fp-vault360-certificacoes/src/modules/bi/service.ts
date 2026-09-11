import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

export async function getDashboardSummary() {
  const supabase = createServerSupabaseClient()
  const [equipment, compliance, training, operations] = await Promise.all([
    supabase.from('v_equipment_summary').select('*').maybeSingle(),
    supabase.from('v_compliance_rate').select('*').maybeSingle(),
    supabase.from('v_training_status').select('*').maybeSingle(),
    supabase.from('v_fp_operations_summary').select('*').maybeSingle(),
  ])
  const failure = [equipment, compliance, training, operations].find((result) => result.error)
  if (failure?.error) throw failure.error
  return { equipment: equipment.data, compliance: compliance.data, training: training.data, operations: operations.data }
}
