import type { SupabaseClient } from '@supabase/supabase-js'
import { getAuthenticatedTenant } from './tenant'

export async function requirePermission(supabase: SupabaseClient, permission: string) {
  const { user, tenantId } = await getAuthenticatedTenant(supabase)
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('is_super_master')
    .eq('id', user.id)
    .single()
  if (profileError) throw profileError
  if (profile?.is_super_master) return { user, tenantId }

  const { data: assignments, error } = await supabase
    .from('user_roles')
    .select('roles!inner(code, role_permissions(permissions!inner(code)))')
    .eq('user_id', user.id)
  if (error) throw error

  const roleCodes = (assignments ?? []).flatMap((assignment: { roles?: { code?: string; role_permissions?: Array<{ permissions?: Array<{ code?: string }> }> } | Array<{ code?: string; role_permissions?: Array<{ permissions?: Array<{ code?: string }> }> }> }) => {
    const roles = Array.isArray(assignment.roles) ? assignment.roles : assignment.roles ? [assignment.roles] : []
    return roles.flatMap((role) => [
      role.code,
      ...((role.role_permissions ?? []).flatMap((item) => (item.permissions ?? []).map((permission) => permission.code))),
    ])
  })
  if (roleCodes.includes('master01') || roleCodes.includes('master02') || roleCodes.includes('master03') || roleCodes.includes('master04')) {
    return { user, tenantId }
  }
  if (roleCodes.includes(permission)) return { user, tenantId }
  throw new Error(`Permissão necessária: ${permission}`)
}
