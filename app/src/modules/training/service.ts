import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { addMonths, formatISO } from 'date-fns'

export type CertificationStatus = 'valid' | 'expiring_soon' | 'expired'

export interface UserCertificationInput {
  user_id: string
  certification_id: string
  training_id?: string
  issued_at: string
  expires_at?: string
  notes?: string
}

export async function listTrainingStatus(filters?: { status?: CertificationStatus; userId?: string }) {
  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('user_certifications')
    .select('*, certification:certifications(name), training:trainings(name), user:users(full_name)')
    .order('expires_at', { ascending: true })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.userId) query = query.eq('user_id', filters.userId)

  const { data, error } = await query
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

export async function listCertifications() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('certifications')
    .select('id, name, category, validity_months')
    .order('name')
  if (error) throw error
  return data
}

export async function createCertification(input: { name: string; category?: string; validity_months?: number }) {
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', auth.user?.id ?? '').single()
  if (!profile?.tenant_id) throw new Error('Usuário não possui tenant')

  const { data, error } = await supabase
    .from('certifications')
    .insert({ ...input, tenant_id: profile.tenant_id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listTrainings() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('trainings')
    .select('id, name, certification_id, provider')
    .order('name')
  if (error) throw error
  return data
}

export async function listTenantUsers() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('is_super_master', false)
    .eq('active', true)
    .is('deleted_at', null)
    .order('full_name')
  if (error) throw error
  return data
}

export async function issueUserCertification(input: UserCertificationInput) {
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', auth.user?.id ?? '').single()
  if (!profile?.tenant_id) throw new Error('Usuário não possui tenant')

  let expiresAt = input.expires_at ?? null
  if (!expiresAt) {
    const { data: certification, error: certificationError } = await supabase
      .from('certifications')
      .select('validity_months')
      .eq('id', input.certification_id)
      .single()
    if (certificationError) throw certificationError
    if (certification?.validity_months) {
      expiresAt = formatISO(addMonths(new Date(input.issued_at), certification.validity_months), { representation: 'date' })
    }
  }

  const { data, error } = await supabase
    .from('user_certifications')
    .insert({
      tenant_id: profile.tenant_id,
      user_id: input.user_id,
      certification_id: input.certification_id,
      training_id: input.training_id ?? null,
      issued_at: input.issued_at,
      expires_at: expiresAt,
      issued_by: auth.user?.id,
      document_path: input.notes ?? null,
    })
    .select('*, certification:certifications(name), training:trainings(name), user:users(full_name)')
    .single()
  if (error) throw error
  return data
}
