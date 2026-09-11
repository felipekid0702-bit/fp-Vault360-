-- ============================================================================
-- FP VAULT360° — MIGRATION 009: SEED DE PERMISSÕES POR MÓDULO
-- ============================================================================

insert into permissions (module, action)
select module, action from (values
  ('equipment','view'),('equipment','create'),('equipment','update'),('equipment','delete'),('equipment','export'),
  ('inspections','view'),('inspections','create'),('inspections','approve'),
  ('kits','view'),('kits','create'),('kits','update'),
  ('training','view'),('training','create'),
  ('audit','view'),('audit','create'),('audit','approve'),
  ('bi','view'),('bi','export'),
  ('imports','view'),('imports','create'),('imports','approve'),
  ('contracts','view'),('contracts','create'),('contracts','update'),
  ('platform','manage_users'),('platform','manage_roles'),('platform','manage_settings')
) as p(module, action)
on conflict (code) do nothing;

-- Gestor de Cliente: quase tudo dentro do seu tenant, exceto config de plataforma
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.code = 'client_manager'
  and p.module in ('equipment','inspections','kits','training','audit','bi','imports','contracts')
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.code = 'client_manager' and p.code = 'platform:manage_users'
on conflict do nothing;

-- Inspetor
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.code = 'inspector'
  and p.code in ('equipment:view','inspections:view','inspections:create','kits:view','bi:view')
on conflict do nothing;

-- Almoxarife
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.code = 'warehouse'
  and p.code in ('equipment:view','equipment:update','kits:view','kits:create','kits:update','imports:view')
on conflict do nothing;

-- Usuário Operacional
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.code = 'operational'
  and p.code in ('equipment:view','inspections:view','inspections:create')
on conflict do nothing;

-- FP Admin: tudo dentro do escopo do tenant master + contratos
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.code = 'fp_admin'
on conflict do nothing;
