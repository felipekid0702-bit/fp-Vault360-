import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { getAuthenticatedTenant } from '@/shared/lib/supabase/tenant'

export async function listImportJobs() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('import_jobs').select('*, layout:import_layouts(name, entity)').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createImportJob(input: { entity: 'equipment' | 'kits' | 'users' | 'trainings'; file_path: string; layout_id?: string; total_rows?: number }) {
  const supabase = createServerSupabaseClient()
  const { user, tenantId } = await getAuthenticatedTenant(supabase)
  const { data, error } = await supabase.from('import_jobs').insert({ ...input, tenant_id: tenantId, created_by: user.id, status: 'queued' }).select().single()
  if (error) throw error
  return data
}
