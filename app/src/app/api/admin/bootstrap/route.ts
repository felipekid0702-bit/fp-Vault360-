import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/shared/lib/supabase/server'

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.BOOTSTRAP_SECRET
  if (!configuredSecret || request.headers.get('x-bootstrap-secret') !== configuredSecret) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const email = process.env.MASTER_EMAIL
  const password = process.env.MASTER_PASSWORD
  if (!email || !password) return NextResponse.json({ error: 'MASTER_EMAIL e MASTER_PASSWORD são obrigatórios' }, { status: 500 })

  const supabase = createServiceRoleClient()
  const masterTenantName = process.env.MASTER_TENANT_NAME ?? 'FP Soluções em Altura'
  const { data: masterTenant, error: masterTenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('is_master', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (masterTenantError) return NextResponse.json({ error: masterTenantError.message }, { status: 400 })
  if (!masterTenant) {
    const { error } = await supabase.from('tenants').insert({
      name: masterTenantName,
      legal_name: masterTenantName,
      is_master: true,
      operation_mode: 'service_provider',
      status: 'active',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const { data: existing } = await supabase.from('users').select('id').eq('is_super_master', true).is('deleted_at', null).maybeSingle()
  if (existing) return NextResponse.json({ data: { created: false, user_id: existing.id } })

  const { data: auth, error: authError } = await supabase.auth.admin.createUser({ email, password, email_confirm: true })
  if (authError || !auth.user) return NextResponse.json({ error: authError?.message ?? 'Falha ao criar usuário' }, { status: 400 })

  const { error } = await supabase.from('users').insert({ id: auth.user.id, tenant_id: null, is_super_master: true, full_name: 'Super Master', email, active: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  const { data: role } = await supabase.from('roles').select('id').eq('code', 'super_master').is('tenant_id', null).single()
  if (role) {
    const { error: roleError } = await supabase.from('user_roles').insert({ user_id: auth.user.id, role_id: role.id, tenant_id: null, assigned_by: auth.user.id })
    if (roleError) return NextResponse.json({ error: roleError.message }, { status: 400 })
  }
  return NextResponse.json({ data: { created: true, user_id: auth.user.id } }, { status: 201 })
}
