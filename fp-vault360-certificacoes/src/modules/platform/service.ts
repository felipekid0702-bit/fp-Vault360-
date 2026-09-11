import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

// Campos exibidos publicamente na tela "Sobre o FP Vault360°".
// company_name e product_name são editáveis SOMENTE pelo Super Master,
// através de update_platform_identity() — nunca por esta rota de leitura,
// e a opção de edição não é renderizada para nenhum outro nível de acesso.
export async function getPlatformIdentity() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('platform_settings')
    .select('company_name, product_name, version, status, base_date')
    .single()

  if (error) throw error
  return data
}

export async function isCurrentUserSuperMaster() {
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return false

  const { data } = await supabase
    .from('users')
    .select('is_super_master')
    .eq('id', auth.user.id)
    .single()

  return data?.is_super_master ?? false
}
