import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

export async function listContracts() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('contracts').select('*, client:tenants!contracts_client_tenant_id_fkey(name), scopes:contract_scopes(id, description, category_id)').order('start_date', { ascending: false })
  if (error) throw error
  return data
}

export async function createContract(input: { client_tenant_id: string; contract_number?: string; scope?: string; sla_days?: number; responsible_team?: string; equipment_quantity?: number; inspection_frequency?: string; start_date: string; end_date?: string; scopes?: Array<{ description: string; category_id?: string }> }) {
  const supabase = createServerSupabaseClient()
  const { data: user } = await supabase.auth.getUser()
  const { scopes, ...contract } = input
  const { data: master } = await supabase.from('tenants').select('id').eq('is_master', true).single()
  if (!master) throw new Error('Tenant master da FP não está configurado')
  const { data, error } = await supabase.from('contracts').insert({ ...contract, fp_tenant_id: master.id }).select().single()
  if (error) throw error
  if (scopes?.length) {
    const { error: scopeError } = await supabase.from('contract_scopes').insert(scopes.map((item) => ({ ...item, contract_id: data.id })))
    if (scopeError) throw scopeError
  }
  await supabase.rpc('log_audit', { p_action: 'contract_created', p_entity: 'contracts', p_entity_id: data.id, p_metadata: { actor: user.user?.id } })
  return data
}
