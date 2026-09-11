-- ============================================================================
-- FP VAULT360° — MIGRATION 008: FUNÇÕES ADMINISTRATIVAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) PROVISIONAMENTO AUTOMÁTICO DE NOVO TENANT
-- ----------------------------------------------------------------------------
create or replace function provision_new_tenant(
  p_name text,
  p_legal_name text,
  p_cnpj text,
  p_operation_mode operation_mode,
  p_admin_user_id uuid, -- já criado previamente em auth.users
  p_admin_name text,
  p_admin_email text
) returns uuid
language plpgsql
security definer
as $$
declare
  v_tenant_id uuid;
  v_manager_role_id uuid;
  v_default_category_id uuid;
  v_default_location_id uuid;
begin
  if not fn_is_super_master() then
    raise exception 'Apenas o Super Master pode provisionar novos tenants';
  end if;

  insert into tenants (name, legal_name, cnpj, operation_mode, status)
  values (p_name, p_legal_name, p_cnpj, p_operation_mode, 'trial')
  returning id into v_tenant_id;

  insert into users (id, tenant_id, full_name, email, active)
  values (p_admin_user_id, v_tenant_id, p_admin_name, p_admin_email, true);

  select id into v_manager_role_id from roles where code = 'client_manager' and tenant_id is null;
  insert into user_roles (user_id, role_id, tenant_id, assigned_by)
  values (p_admin_user_id, v_manager_role_id, v_tenant_id, auth.uid());

  -- Estrutura padrão: almoxarifado (location), categoria genérica, checklist padrão
  insert into locations (tenant_id, name, description)
  values (v_tenant_id, 'Almoxarifado Central', 'Local padrão criado no onboarding')
  returning id into v_default_location_id;

  insert into equipment_categories (tenant_id, name, code)
  values (v_tenant_id, 'Geral', 'GERAL')
  returning id into v_default_category_id;

  insert into audit_log (tenant_id, user_id, action, entity, entity_id, metadata)
  values (v_tenant_id, auth.uid(), 'tenant_provisioned', 'tenants', v_tenant_id,
          jsonb_build_object('operation_mode', p_operation_mode));

  return v_tenant_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2) TRANSFERÊNCIA DE TITULARIDADE DO SUPER MASTER
-- ----------------------------------------------------------------------------
create or replace function transfer_super_master(p_new_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_current_id uuid;
begin
  if not fn_is_super_master() then
    raise exception 'Apenas o Super Master atual pode transferir a titularidade';
  end if;

  select id into v_current_id from users where is_super_master = true and deleted_at is null;

  if v_current_id is null then
    raise exception 'Nenhum Super Master ativo encontrado';
  end if;

  update users set is_super_master = false, tenant_id = coalesce(tenant_id, null) where id = v_current_id;
  update users set is_super_master = true, tenant_id = null where id = p_new_user_id;

  insert into audit_log (tenant_id, user_id, action, entity, entity_id, metadata)
  values (null, auth.uid(), 'super_master_transfer', 'users', p_new_user_id,
          jsonb_build_object('previous_super_master', v_current_id, 'new_super_master', p_new_user_id));
end;
$$;

-- ----------------------------------------------------------------------------
-- 3) VERSIONAMENTO AUTOMÁTICO (alterna sufixos .2 / .3)
-- ----------------------------------------------------------------------------
create or replace function bump_version(p_source_system text default 'fpvault360')
returns text
language plpgsql
security definer
as $$
declare
  v_current text;
  v_major int;
  v_minor int;
  v_new text;
begin
  select version into v_current from platform_settings limit 1;

  v_major := split_part(v_current, '.', 1)::int;
  v_minor := split_part(v_current, '.', 2)::int;

  if v_current = format('%s.0', v_major) then
    v_new := format('%s.2', v_major);
  elsif v_minor = 2 then
    v_new := format('%s.3', v_major);
  else
    v_new := format('%s.2', v_major + 1);
  end if;

  update platform_settings set version = v_new, updated_at = now();
  insert into version_history (version, source_system) values (v_new, p_source_system);

  return v_new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4) EDIÇÃO DE EMPRESA/PRODUTO (somente Super Master, sem exposição na UI padrão)
-- ----------------------------------------------------------------------------
create or replace function update_platform_identity(p_company_name text, p_product_name text)
returns void
language plpgsql
security definer
as $$
begin
  if not fn_is_super_master() then
    raise exception 'Apenas o Super Master pode alterar a identidade da plataforma';
  end if;

  update platform_settings
    set company_name = coalesce(p_company_name, company_name),
        product_name = coalesce(p_product_name, product_name),
        updated_at = now(),
        updated_by = auth.uid();

  insert into audit_log (user_id, action, entity, metadata)
  values (auth.uid(), 'platform_identity_updated', 'platform_settings',
          jsonb_build_object('company_name', p_company_name, 'product_name', p_product_name));
end;
$$;

-- ----------------------------------------------------------------------------
-- 5) LOG HELPER (chamado pelas Edge Functions / API para toda mutação relevante)
-- ----------------------------------------------------------------------------
create or replace function log_audit(
  p_action text, p_entity text, p_entity_id uuid, p_metadata jsonb default '{}'::jsonb
) returns void
language sql
security definer
as $$
  insert into audit_log (tenant_id, user_id, action, entity, entity_id, metadata)
  values (fn_current_user_tenant(), auth.uid(), p_action, p_entity, p_entity_id, p_metadata);
$$;
