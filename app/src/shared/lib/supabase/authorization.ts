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

const INSPECTION_APPROVAL_ROLE_CODES = new Set([
  'super_master',
  'sup_master',
  'master01',
  'master02',
  'master03',
  'master04',
])

type RoleAssignment = {
  roles?:
    | { code?: string | null; role_permissions?: Array<{ permissions?: Array<{ code?: string | null }> | null }> | null }
    | Array<{ code?: string | null; role_permissions?: Array<{ permissions?: Array<{ code?: string | null }> | null }> | null }>
    | null
}

function extractRoleCodes(assignments: RoleAssignment[] | null | undefined) {
  return (assignments ?? []).flatMap((assignment) => {
    const roles = Array.isArray(assignment.roles)
      ? assignment.roles
      : assignment.roles
        ? [assignment.roles]
        : []

    return roles.flatMap((role) => {
      const permissionCodes = (role.role_permissions ?? []).flatMap((item) =>
        (item.permissions ?? []).map((permission) => permission.code).filter(Boolean) as string[],
      )

      return [role.code, ...permissionCodes].filter((code): code is string => Boolean(code))
    })
  })
}

function normalizeRoleCodes(roleCodes: string[]) {
  return new Set(roleCodes.map((code) => code.toLowerCase()))
}

export async function canDeleteRecords(supabase: SupabaseClient) {
  const { user } = await getAuthenticatedTenant(supabase)

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('is_super_master')
    .eq('id', user.id)
    .single()

  if (profileError) throw profileError
  if (profile?.is_super_master) return true

  const { data: assignments, error } = await supabase
    .from('user_roles')
    .select('roles!inner(code, role_permissions(permissions!inner(code)))')
    .eq('user_id', user.id)

  if (error) throw error

  const normalizedRoleCodes = normalizeRoleCodes(extractRoleCodes((assignments ?? []) as RoleAssignment[]))
  return Array.from(normalizedRoleCodes).some((roleCode) => FULL_DELETE_ROLE_CODES.has(roleCode))
}

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

  const normalizedRoleCodes = normalizeRoleCodes(extractRoleCodes((assignments ?? []) as RoleAssignment[]))

  const hasFullDeleteRole = Array.from(normalizedRoleCodes).some((roleCode) => FULL_DELETE_ROLE_CODES.has(roleCode))
  const isDeletePermission = permission.endsWith(':delete') || permission === 'delete'

  if (hasFullDeleteRole && isDeletePermission) {
    return { user, tenantId }
  }

  if (normalizedRoleCodes.has(permission)) return { user, tenantId }
  throw new Error(`Permissão necessária: ${permission}`)
}

export async function requireInspectionApproval(supabase: SupabaseClient) {
  const { user, tenantId } = await getAuthenticatedTenant(supabase)
  const { data: profile, error: profileError } = await supabase.from('users').select('is_super_master').eq('id', user.id).single()
  if (profileError) throw profileError
  if (profile?.is_super_master) return { user, tenantId }

  const { data: assignments, error } = await supabase
    .from('user_roles')
    .select('roles!inner(code)')
    .eq('user_id', user.id)
  if (error) throw error
  const roleCodes = normalizeRoleCodes(extractRoleCodes((assignments ?? []) as RoleAssignment[]))
  if (!Array.from(roleCodes).some((roleCode) => INSPECTION_APPROVAL_ROLE_CODES.has(roleCode))) {
    throw new Error('Aprovação de inspeção restrita aos perfis MASTER e SUPERIOR_MASTER.')
  }
  return { user, tenantId }
}
