-- ============================================================================
-- FP VAULT360° — MIGRATION 007: ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Estratégia: toda tabela de negócio expõe tenant_id. Uma função auxiliar lê o
-- tenant do usuário autenticado a partir da tabela `users` (não do JWT bruto,
-- para permitir revogação imediata sem esperar expirar o token) e verifica se
-- é Super Master (bypass total).

create or replace function fn_current_user_tenant()
returns uuid as $$
  select tenant_id from users where id = auth.uid() and deleted_at is null;
$$ language sql stable security definer;

create or replace function fn_is_super_master()
returns boolean as $$
  select coalesce((select is_super_master from users where id = auth.uid() and deleted_at is null), false);
$$ language sql stable security definer;

create or replace function fn_has_permission(p_module text, p_action text)
returns boolean as $$
  select exists (
    select 1
    from user_roles ur
    join role_permissions rp on rp.role_id = ur.role_id
    join permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and p.module = p_module
      and p.action = p_action
  ) or fn_is_super_master();
$$ language sql stable security definer;

-- Macro (aplicada tabela a tabela abaixo): política padrão de isolamento
-- USING: is_super_master() OR tenant_id = fn_current_user_tenant()
-- Para tenants em modo "service_provider"/"hybrid", o tenant master (FP)
-- também enxerga via join em `contracts` (ver policies específicas de equipment/inspections).

do $$
declare
  t text;
  tables text[] := array[
    'tenants','users','roles','user_roles',
    'manufacturers','equipment_categories','cost_centers','locations','equipment',
    'equipment_codes','equipment_photos','documents',
    'checklist_templates','inspections','inspection_items_result',
    'inspection_evidences','inspection_signatures',
    'rope_details','rope_cuts','rope_usage_history','kits','kit_items',
    'certifications','trainings','user_certifications',
    'audits','nonconformities','action_plans',
    'import_layouts','import_jobs',
    'contracts','notification_rules','notifications',
    'audit_log'
  ];
begin
  foreach t in array tables loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- ---- TENANTS ----
create policy tenants_select on tenants for select
  using (fn_is_super_master() or id = fn_current_user_tenant()
         or id in (select client_tenant_id from contracts where fp_tenant_id = fn_current_user_tenant()));
create policy tenants_update on tenants for update
  using (fn_is_super_master())
  with check (fn_is_super_master());
create policy tenants_insert on tenants for insert
  with check (fn_is_super_master());
create policy tenants_delete on tenants for delete
  using (fn_is_super_master());

-- ---- USERS ----
create policy users_select on users for select
  using (fn_is_super_master() or tenant_id = fn_current_user_tenant());
create policy users_modify on users for all
  using (fn_is_super_master() or (tenant_id = fn_current_user_tenant() and fn_has_permission('platform','manage_users')))
  with check (fn_is_super_master() or tenant_id = fn_current_user_tenant());
-- Proteção extra: ninguém além do próprio Super Master altera/exclui o registro dele
create policy users_protect_super_master on users for update
  using (not is_super_master or auth.uid() = id);

-- ---- Tabelas padrão de tenant (isolamento simples) ----
do $$
declare
  t text;
  simple_tenant_tables text[] := array[
    'manufacturers','equipment_categories','cost_centers','locations',
    'checklist_templates','rope_details','rope_cuts','rope_usage_history',
    'kits','certifications','trainings','user_certifications',
    'audits','nonconformities','action_plans',
    'import_layouts','import_jobs',
    'notification_rules','notifications'
  ];
begin
  foreach t in array simple_tenant_tables loop
    execute format($f$
      create policy %1$I_tenant_isolation on %1$I for all
        using (fn_is_super_master() or tenant_id = fn_current_user_tenant())
        with check (fn_is_super_master() or tenant_id = fn_current_user_tenant());
    $f$, t);
  end loop;
end $$;

-- ---- TABELAS FILHAS SEM tenant_id ----
create policy import_errors_isolation on import_errors for all
  using (
    fn_is_super_master()
    or exists (
      select 1
      from import_jobs ij
      where ij.id = import_errors.import_job_id
        and ij.tenant_id = fn_current_user_tenant()
    )
  )
  with check (
    fn_is_super_master()
    or exists (
      select 1
      from import_jobs ij
      where ij.id = import_errors.import_job_id
        and ij.tenant_id = fn_current_user_tenant()
    )
  );

create policy contract_scopes_isolation on contract_scopes for all
  using (
    fn_is_super_master()
    or exists (
      select 1
      from contracts c
      where c.id = contract_scopes.contract_id
        and (c.fp_tenant_id = fn_current_user_tenant() or c.client_tenant_id = fn_current_user_tenant())
    )
  )
  with check (
    fn_is_super_master()
    or exists (
      select 1
      from contracts c
      where c.id = contract_scopes.contract_id
        and c.fp_tenant_id = fn_current_user_tenant()
    )
  );

create policy document_versions_isolation on document_versions for all
  using (
    fn_is_super_master()
    or exists (
      select 1
      from documents d
      where d.id = document_versions.document_id
        and d.tenant_id = fn_current_user_tenant()
    )
  )
  with check (
    fn_is_super_master()
    or exists (
      select 1
      from documents d
      where d.id = document_versions.document_id
        and d.tenant_id = fn_current_user_tenant()
    )
  );

-- ---- CHECKLIST ITEMS (isolamento pelo template pai) ----
create policy checklist_items_tenant_isolation on checklist_items for all
  using (
    fn_is_super_master()
    or exists (
      select 1
      from checklist_templates ct
      where ct.id = checklist_items.template_id
        and ct.tenant_id = fn_current_user_tenant()
    )
  )
  with check (
    fn_is_super_master()
    or exists (
      select 1
      from checklist_templates ct
      where ct.id = checklist_items.template_id
        and ct.tenant_id = fn_current_user_tenant()
    )
  );

-- ---- EQUIPMENT (inclui visibilidade da FP em modo prestador/híbrido) ----
create policy equipment_select on equipment for select
  using (
    fn_is_super_master()
    or tenant_id = fn_current_user_tenant()
    or tenant_id in (select client_tenant_id from contracts where fp_tenant_id = fn_current_user_tenant() and status = 'active')
  );
create policy equipment_modify on equipment for insert with check (
  fn_is_super_master() or tenant_id = fn_current_user_tenant());
create policy equipment_update on equipment for update using (
  fn_is_super_master() or tenant_id = fn_current_user_tenant());
create policy equipment_delete on equipment for delete using (
  fn_is_super_master() or tenant_id = fn_current_user_tenant());

-- ---- INSPECTIONS (mesma regra de visibilidade cruzada da FP) ----
create policy inspections_select on inspections for select
  using (
    fn_is_super_master()
    or tenant_id = fn_current_user_tenant()
    or tenant_id in (select client_tenant_id from contracts where fp_tenant_id = fn_current_user_tenant() and status = 'active')
  );
create policy inspections_write on inspections for insert with check (
  fn_is_super_master() or tenant_id = fn_current_user_tenant());
create policy inspections_update on inspections for update using (
  fn_is_super_master() or tenant_id = fn_current_user_tenant());

-- ---- Tabelas filhas de inspection (join até tenant_id via inspection_id) ----
create policy inspection_items_result_isolation on inspection_items_result for all
  using (fn_is_super_master() or exists (
    select 1 from inspections i where i.id = inspection_id and i.tenant_id = fn_current_user_tenant()));
create policy inspection_evidences_isolation on inspection_evidences for all
  using (fn_is_super_master() or exists (
    select 1 from inspections i where i.id = inspection_id and i.tenant_id = fn_current_user_tenant()));
create policy inspection_signatures_isolation on inspection_signatures for all
  using (fn_is_super_master() or exists (
    select 1 from inspections i where i.id = inspection_id and i.tenant_id = fn_current_user_tenant()));

-- ---- KIT ITEMS (join via kits) ----
create policy kit_items_isolation on kit_items for all
  using (fn_is_super_master() or exists (
    select 1 from kits k where k.id = kit_id and k.tenant_id = fn_current_user_tenant()));

-- ---- EQUIPMENT CODES / PHOTOS / DOCUMENTS (join via equipment) ----
create policy equipment_codes_isolation on equipment_codes for all
  using (fn_is_super_master() or tenant_id = fn_current_user_tenant());
create policy equipment_photos_isolation on equipment_photos for all
  using (fn_is_super_master() or tenant_id = fn_current_user_tenant());
create policy documents_isolation on documents for all
  using (fn_is_super_master() or tenant_id = fn_current_user_tenant());

-- ---- CONTRACTS (visível para FP e para o cliente vinculado) ----
create policy contracts_select on contracts for select
  using (fn_is_super_master() or fp_tenant_id = fn_current_user_tenant() or client_tenant_id = fn_current_user_tenant());
create policy contracts_write on contracts for all
  using (fn_is_super_master() or fp_tenant_id = fn_current_user_tenant())
  with check (fn_is_super_master() or fp_tenant_id = fn_current_user_tenant());

-- ---- AUDIT LOG (leitura restrita: próprio tenant ou super master; INSERT sempre liberado via função) ----
create policy audit_log_select on audit_log for select
  using (fn_is_super_master() or tenant_id = fn_current_user_tenant());
create policy audit_log_insert on audit_log for insert with check (true);

-- ---- ROLES / USER_ROLES ----
create policy roles_select on roles for select
  using (tenant_id is null or fn_is_super_master() or tenant_id = fn_current_user_tenant());
create policy user_roles_select on user_roles for select
  using (fn_is_super_master() or tenant_id = fn_current_user_tenant());
create policy user_roles_write on user_roles for all
  using (fn_is_super_master() or (tenant_id = fn_current_user_tenant() and fn_has_permission('platform','manage_roles')))
  with check (fn_is_super_master() or tenant_id = fn_current_user_tenant());
