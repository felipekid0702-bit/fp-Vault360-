import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

export async function listImportJobs() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('import_jobs').select('*, layout:import_layouts(name, entity)').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createImportJob(input: { entity: 'equipment' | 'kits' | 'users' | 'trainings'; file_path: string; layout_id?: string; total_rows?: number }) {
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', auth.user?.id ?? '').single()
  if (!profile?.tenant_id) throw new Error('Usuário não possui tenant')
  const { data, error } = await supabase.from('import_jobs').insert({ ...input, tenant_id: profile.tenant_id, created_by: auth.user?.id, status: 'queued' }).select().single()
  if (error) throw error
  return data
}
