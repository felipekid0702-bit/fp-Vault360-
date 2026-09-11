-- Templates FP oficiais são globais e devem ser herdados por todos os tenants.
drop policy if exists checklist_templates_tenant_isolation on checklist_templates;
create policy checklist_templates_select_global_or_tenant on checklist_templates
  for select
  using (tenant_id is null or fn_is_super_master() or tenant_id = fn_current_user_tenant());
create policy checklist_templates_write_tenant on checklist_templates
  for insert
  with check (fn_is_super_master() or tenant_id = fn_current_user_tenant());
create policy checklist_templates_update_tenant on checklist_templates
  for update
  using (fn_is_super_master() or tenant_id = fn_current_user_tenant())
  with check (fn_is_super_master() or tenant_id = fn_current_user_tenant());
create policy checklist_templates_delete_tenant on checklist_templates
  for delete
  using (fn_is_super_master() or tenant_id = fn_current_user_tenant());

drop policy if exists checklist_items_tenant_isolation on checklist_items;
create policy checklist_items_select_global_or_tenant on checklist_items
  for select
  using (
    fn_is_super_master()
    or exists (
      select 1 from checklist_templates ct
      where ct.id = checklist_items.template_id
        and (ct.tenant_id is null or ct.tenant_id = fn_current_user_tenant())
    )
  );
create policy checklist_items_write_tenant on checklist_items
  for insert
  with check (
    fn_is_super_master()
    or exists (
      select 1 from checklist_templates ct
      where ct.id = checklist_items.template_id
        and ct.tenant_id = fn_current_user_tenant()
    )
  );
create policy checklist_items_update_tenant on checklist_items
  for update
  using (
    fn_is_super_master()
    or exists (
      select 1 from checklist_templates ct
      where ct.id = checklist_items.template_id
        and ct.tenant_id = fn_current_user_tenant()
    )
  )
  with check (
    fn_is_super_master()
    or exists (
      select 1 from checklist_templates ct
      where ct.id = checklist_items.template_id
        and ct.tenant_id = fn_current_user_tenant()
    )
  );
create policy checklist_items_delete_tenant on checklist_items
  for delete
  using (
    fn_is_super_master()
    or exists (
      select 1 from checklist_templates ct
      where ct.id = checklist_items.template_id
        and ct.tenant_id = fn_current_user_tenant()
    )
  );

do $$
declare
  v_code text;
  v_template_id uuid;
  v_names text[] := array[
    'Ascensor', 'Descensor', 'Trava-quedas', 'Talabarte',
    'Corda', 'Cinta Sling', 'Cinto', 'Mosquetão',
    'Polia', 'Fita Anel', 'Estribo', 'Mailon'
  ];
  v_objectives text[] := array[
    'Verificar integridade, funcionamento e bloqueio do ascensor.',
    'Verificar placas, atrito, manopla e fechos do descensor.',
    'Verificar bloqueio, patilha e absorvedor do trava-quedas.',
    'Verificar fitas, costuras, ajustes e conectores do talabarte.',
    'Verificar alma, capa, costuras, desgaste e contaminação da corda.',
    'Verificar fibras, costuras, deformações e contaminação da cinta sling.',
    'Verificar corpo, fivelas, ajustes, costuras e elementos de conexão.',
    'Verificar corpo, trava, gatilho, deformações e corrosão do mosquetão.',
    'Verificar placas, roldanas, eixos, pinos e funcionamento da polia.',
    'Verificar costuras, desgaste, deformações e resistência da fita anel.',
    'Verificar fita, costuras, ajuste e integridade do estribo.',
    'Verificar corpo, rosca, fechamento e integridade do mailon.'
  ];
begin
  for i in 1..12 loop
    v_code := 'FP' || lpad(i::text, 2, '0');
    insert into checklist_templates (tenant_id, template_code, name, objective, inspection_type, active)
    values (null, v_code, v_code || ' - ' || v_names[i], v_objectives[i], 'periodic', true)
    on conflict do nothing;

    select id into v_template_id
    from checklist_templates
    where tenant_id is null and template_code = v_code;

    insert into checklist_items (template_id, section, label, description, order_index, is_critical, required, evidence_required)
    select v_template_id, item.section, item.label, item.description, item.order_index, item.is_critical, true, false
    from (values
      ('Visual', 'Integridade estrutural', 'Verificar cortes, fissuras, deformações, corrosão e desgaste.', 1, true),
      ('Visual', 'Identificação e componentes', 'Confirmar identificação, componentes, fechos, costuras e conexões.', 2, true),
      ('Funcional', 'Funcionamento operacional', 'Executar teste funcional conforme o procedimento aplicável.', 3, true)
    ) as item(section, label, description, order_index, is_critical)
    where not exists (
      select 1 from checklist_items existing
      where existing.template_id = v_template_id and existing.label = item.label
    );
  end loop;
end $$;
