import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient, createServiceRoleClient } from '@/shared/lib/supabase/server'
import { getAuthenticatedTenant } from '@/shared/lib/supabase/tenant'
import { requirePermission } from '@/shared/lib/supabase/authorization'

const createSchema = z.object({
  full_name: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  access_type: z.enum(['fp', 'client']),
  role_code: z.enum(['super_master', 'sup_master', 'master01', 'master02', 'master03', 'master04', 'submaster', 'sub_master01', 'client_portal']),
  client_id: z.string().uuid().nullable().optional(),
})

const resetSchema = z.object({ user_id: z.string().uuid(), password: z.string().min(8) })

async function assertAdmin() {
  const supabase = createServerSupabaseClient()
  const { user, tenantId } = await requirePermission(supabase, 'users:manage')
  return { supabase, user, tenantId }
}

export async function GET() {
  try {
    const { supabase, tenantId } = await assertAdmin()
    const { data, error } = await supabase.from('users').select('id, full_name, email, active, must_change_password, client_id, user_roles(roles(code, name))').eq('tenant_id', tenantId).is('deleted_at', null).order('full_name')
    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível listar acessos.' }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  const parsed = createSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try {
    const { supabase, user, tenantId } = await assertAdmin()
    if (parsed.data.access_type === 'client' && !parsed.data.client_id) return NextResponse.json({ error: 'Selecione o cliente do acesso.' }, { status: 422 })
    const admin = createServiceRoleClient()
    const { data: auth, error: authError } = await admin.auth.admin.createUser({ email: parsed.data.email, password: parsed.data.password, email_confirm: true })
    if (authError || !auth.user) throw authError ?? new Error('Não foi possível criar o usuário.')
    const { data: profile, error: profileError } = await admin.from('users').insert({ id: auth.user.id, tenant_id: tenantId, client_id: parsed.data.access_type === 'client' ? parsed.data.client_id : null, full_name: parsed.data.full_name, email: parsed.data.email, active: true, must_change_password: true, created_by: user.id, updated_by: user.id }).select().single()
    if (profileError) throw profileError
    const { data: role, error: roleError } = await admin.from('roles').select('id').eq('code', parsed.data.role_code).is('tenant_id', null).single()
    if (roleError || !role) throw roleError ?? new Error('Perfil de acesso não encontrado.')
    const { error: assignmentError } = await admin.from('user_roles').insert({ user_id: auth.user.id, role_id: role.id, tenant_id: tenantId, assigned_by: user.id })
    if (assignmentError) throw assignmentError
    return NextResponse.json({ data: profile }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível criar o acesso.' }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  const parsed = resetSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try {
    const { supabase, user, tenantId } = await assertAdmin()
    const { data: target, error: targetError } = await supabase.from('users').select('id').eq('id', parsed.data.user_id).eq('tenant_id', tenantId).single()
    if (targetError || !target) return NextResponse.json({ error: 'Acesso não encontrado neste tenant.' }, { status: 404 })
    const { error } = await createServiceRoleClient().auth.admin.updateUserById(parsed.data.user_id, { password: parsed.data.password })
    if (error) throw error
    const { error: profileError } = await createServiceRoleClient().from('users').update({ must_change_password: true, updated_by: user.id }).eq('id', parsed.data.user_id)
    if (profileError) throw profileError
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível redefinir a senha.' }, { status: 400 })
  }
}
