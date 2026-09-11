CREATE OR REPLACE FUNCTION public.provision_new_tenant(
  p_name text, p_legal_name text, p_cnpj text, p_operation_mode public.operation_mode,
  p_admin_user_id uuid, p_admin_name text, p_admin_email text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
declare
  v_tenant_id uuid;
  v_manager_role_id uuid;
  v_default_category_id uuid;
  v_default_location_id uuid;
  v_checklist_id uuid;
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

  -- Estrutura padrão: almoxarifado (location), categoria genérica
  insert into locations (tenant_id, name, description)
  values (v_tenant_id, 'Almoxarifado Central', 'Local padrão criado no onboarding')
  returning id into v_default_location_id;

  insert into equipment_categories (tenant_id, name, code, default_lifespan_months)
  values (v_tenant_id, 'Geral', 'GERAL', 60)
  returning id into v_default_category_id;

  -- Checklist padrão (Módulo 0 / Módulo 3): checklist genérico de inspeção periódica,
  -- para que o tenant já consiga inspecionar equipamentos assim que importar o inventário.
  insert into checklist_templates (tenant_id, category_id, name, inspection_type, active)
  values (v_tenant_id, v_default_category_id, 'Checklist Padrão - Inspeção Periódica', 'periodic', true)
  returning id into v_checklist_id;

  insert into checklist_items (template_id, label, description, order_index, is_critical) values
    (v_checklist_id, 'Estado geral / integridade visual', 'Verificar cortes, deformações, desgaste excessivo', 1, true),
    (v_checklist_id, 'Corrosão ou contaminação química', 'Sinais de oxidação ou contato com produtos químicos', 2, true),
    (v_checklist_id, 'Costuras e fixações', 'Costuras, rebites e fivelas sem danos', 3, true),
    (v_checklist_id, 'Legibilidade da identificação/CA', 'Número de série e certificação legíveis', 4, false),
    (v_checklist_id, 'Validade e vida útil', 'Dentro do prazo de validade do fabricante', 5, true);

  update equipment_categories set checklist_template_id = v_checklist_id where id = v_default_category_id;

  -- Agenda de inspeções / alertas padrão (Módulo 10): regras de notificação já ativas
  -- para o tenant assim que ele nasce, cobrindo vencimento de equipamentos e treinamentos.
  insert into notification_rules (tenant_id, event, channels, days_before, active) values
    (v_tenant_id, 'equipment_expiring', ARRAY['email']::notification_channel[], 30, true),
    (v_tenant_id, 'equipment_expired', ARRAY['email']::notification_channel[], 0, true),
    (v_tenant_id, 'training_expiring', ARRAY['email']::notification_channel[], 30, true),
    (v_tenant_id, 'training_expired', ARRAY['email']::notification_channel[], 0, true);

  insert into audit_log (tenant_id, user_id, action, entity, entity_id, metadata)
  values (v_tenant_id, auth.uid(), 'tenant_provisioned', 'tenants', v_tenant_id,
          jsonb_build_object('operation_mode', p_operation_mode));

  return v_tenant_id;
end;
$$;
;
