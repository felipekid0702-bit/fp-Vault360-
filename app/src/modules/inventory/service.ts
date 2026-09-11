import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

export async function listManufacturers() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('manufacturers').select('id, name, country, website').is('deleted_at', null).order('name')
  if (error) throw error
  return data
}

export async function createManufacturer(input: { name: string; country?: string; website?: string }) {
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('manufacturers').insert({ ...input, created_by: auth.user?.id, updated_by: auth.user?.id }).select().single()
  if (error) throw error
  return data
}

export async function listCategories() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('equipment_categories').select('id, name, code, default_lifespan_months').is('deleted_at', null).order('name')
  if (error) throw error
  return data
}

export async function createCategory(input: { name: string; code?: string; default_lifespan_months?: number }) {
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('equipment_categories').insert({ ...input, created_by: auth.user?.id, updated_by: auth.user?.id }).select().single()
  if (error) throw error
  return data
}