-- Directive 001: FP team access permissions.
-- The existing is_super_master account is intentionally not changed or exposed.

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
cross join permissions p
where r.tenant_id is null
  and r.code in ('sup_master', 'master01', 'master02', 'master03')
  and p.code in (
    'equipment:view', 'equipment:create', 'equipment:update', 'equipment:delete', 'equipment:export',
    'inspections:view', 'inspections:create', 'inspections:approve',
    'kits:view', 'kits:create', 'kits:update',
    'training:view', 'training:create',
    'audit:view', 'audit:create', 'audit:approve',
    'bi:view', 'bi:export',
    'imports:view', 'imports:create', 'imports:approve',
    'contracts:view', 'contracts:create', 'contracts:update',
    'platform:manage_users', 'platform:manage_roles', 'platform:manage_settings',
    'clients:view', 'clients:create', 'clients:update', 'clients:delete',
    'services:view', 'services:create', 'services:update', 'services:delete',
    'reports:view', 'reports:export',
    'users:manage'
  )
on conflict do nothing;