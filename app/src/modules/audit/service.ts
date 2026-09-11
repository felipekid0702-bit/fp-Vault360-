import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

export async function listAudits() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('audits').select('*, auditor:users(full_name)').order('started_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createAudit(input: { title: string; scope?: string; auditor_id?: string }) {
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', auth.user?.id ?? '').single()
  if (!profile?.tenant_id) throw new Error('Usuário não possui tenant')
  const { data, error } = await supabase.from('audits').insert({ ...input, tenant_id: profile.tenant_id, created_by: auth.user?.id, updated_by: auth.user?.id }).select().single()
  if (error) throw error
  return data
}
