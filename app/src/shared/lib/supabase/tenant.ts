import type { SupabaseClient } from '@supabase/supabase-js'

export async function getAuthenticatedTenant(
  supabase: SupabaseClient,
) {
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!auth.user) throw new Error('Sessão expirada')

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('tenant_id, is_super_master')
    .eq('id', auth.user.id)
    .single()

  if (profileError) throw profileError
  if (profile?.tenant_id) return { user: auth.user, tenantId: profile.tenant_id }

  if (profile?.is_super_master) {
    const { data: masterTenant, error: masterTenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('is_master', true)
      .is('deleted_at', null)
      .maybeSingle()

    if (masterTenantError) throw masterTenantError
    if (masterTenant?.id) return { user: auth.user, tenantId: masterTenant.id }
  }

  throw new Error('Usuário não possui tenant operacional. Vincule o usuário a um tenant antes de continuar.')
}
