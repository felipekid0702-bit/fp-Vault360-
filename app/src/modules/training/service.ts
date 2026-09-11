import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

export async function listTrainingStatus() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('user_certifications').select('*, certification:certifications(name), training:trainings(name)').order('expires_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createTraining(input: { name: string; certification_id?: string; provider?: string }) {
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', auth.user?.id ?? '').single()
  if (!profile?.tenant_id) throw new Error('Usuário não possui tenant')
  const { data, error } = await supabase.from('trainings').insert({ ...input, tenant_id: profile.tenant_id }).select().single()
  if (error) throw error
  return data
}
