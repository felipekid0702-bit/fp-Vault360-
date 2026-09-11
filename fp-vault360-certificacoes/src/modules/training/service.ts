import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { addMonths, formatISO } from 'date-fns'
import type {
  Certification,
  CertificationInput,
  Training,
  TrainingInput,
  UserCertification,
  UserCertificationInput,
  CertificationStatus,
  TenantUserOption,
} from './types'

// ---------------------------------------------------------------------------
// Certificações emitidas (user_certifications) — visão principal do módulo
// ---------------------------------------------------------------------------

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

/**
 * Emite (vincula) uma certificação a um colaborador. É este registro que
 * efetivamente aparece na listagem de Treinamentos/Certificações — diferente
 * de createTraining, que apenas cadastra o curso no catálogo, e de
 * createCertification, que cadastra o tipo de certificação.
 *
 * A validade (expires_at), quando não informada manualmente, é calculada a
 * partir de certifications.validity_months. O campo "status" é uma coluna
 * gerada pelo banco e nunca é enviado no insert.
 */
export async function issueUserCertification(input: UserCertificationInput) {
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', auth.user?.id ?? '').single()
  if (!profile?.tenant_id) throw new Error('Usuário não possui tenant')

  let expiresAt = input.expires_at ?? null
  if (!expiresAt) {
    const { data: certification } = await supabase
      .from('certifications')
      .select('validity_months')
      .eq('id', input.certification_id)
      .single()
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
      notes: input.notes,
      created_by: auth.user?.id,
      updated_by: auth.user?.id,
    })
    .select('*, certification:certifications(name), training:trainings(name), user:users(full_name)')
    .single()

  if (error) throw error

  await supabase.rpc('log_audit', {
    p_action: 'certification_issued',
    p_entity: 'user_certifications',
    p_entity_id: data.id,
    p_metadata: { user_id: input.user_id, certification_id: input.certification_id },
  })

  return data as UserCertification
}

// ---------------------------------------------------------------------------
// Catálogo de treinamentos/cursos (trainings)
// ---------------------------------------------------------------------------

export async function listTrainings() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('trainings')
    .select('id, name, certification_id, provider')
    .order('name')
  if (error) throw error
  return data
}

export async function createTraining(input: TrainingInput) {
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', auth.user?.id ?? '').single()
  if (!profile?.tenant_id) throw new Error('Usuário não possui tenant')
  const { data, error } = await supabase
    .from('trainings')
    .insert({ ...input, tenant_id: profile.tenant_id, created_by: auth.user?.id, updated_by: auth.user?.id })
    .select()
    .single()
  if (error) throw error
  return data as Training
}

// ---------------------------------------------------------------------------
// Catálogo de tipos de certificação (certifications)
// ---------------------------------------------------------------------------

export async function listCertifications() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('certifications')
    .select('id, name, code, validity_months, description')
    .order('name')
  if (error) throw error
  return data
}

export async function createCertification(input: CertificationInput) {
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', auth.user?.id ?? '').single()
  if (!profile?.tenant_id) throw new Error('Usuário não possui tenant')
  const { data, error } = await supabase
    .from('certifications')
    .insert({ ...input, tenant_id: profile.tenant_id, created_by: auth.user?.id, updated_by: auth.user?.id })
    .select()
    .single()
  if (error) throw error
  return data as Certification
}

// ---------------------------------------------------------------------------
// Colaboradores do tenant (para o formulário de emissão)
// ---------------------------------------------------------------------------

/**
 * Lista os colaboradores do tenant atual para seleção nos formulários deste
 * módulo. O Super Master nunca aparece aqui: além de não possuir tenant_id
 * (o que já o excluiria via RLS), o filtro is_super_master reforça a regra
 * de que sua identidade fica oculta para todos os outros níveis de acesso.
 */
export async function listTenantUsers(): Promise<TenantUserOption[]> {
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
