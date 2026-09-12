import type { SupabaseClient } from '@supabase/supabase-js'
import { getAuthenticatedTenant } from './tenant'

const FULL_DELETE_ROLE_CODES = new Set([
  'super_master',
  'sup_master',
  'master01',
  'master02',
  'master03',
  'master04',
])

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

  const normalizedRoleCodes = new Set((roleCodes ?? []).filter(Boolean).map((code) => code.toLowerCase()))

  const hasFullDeleteRole = [...normalizedRoleCodes].some((roleCode) => FULL_DELETE_ROLE_CODES.has(roleCode))
  const isDeletePermission = permission.endsWith(':delete') || permission === 'delete'

  if (hasFullDeleteRole && isDeletePermission) {
    return { user, tenantId }
  }

  if (normalizedRoleCodes.has(permission)) return { user, tenantId }
  throw new Error(`Permissão necessária: ${permission}`)
}
