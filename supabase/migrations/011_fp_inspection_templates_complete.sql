-- FP VAULT360 - MIGRATION 011: CATALOG0 COMPLETO DAS FICHAS FP01-FP12
-- Complementa a migration 010 sem remover os campos legados do motor.

alter table inspections
  add column if not exists history_fall boolean not null default false,
  add column if not exists history_chemical_or_abrasive boolean not null default false,
  add column if not exists history_temperature_out_of_range boolean not null default false,
  add column if not exists history_unauthorized_modification boolean not null default false;

create or replace function fn_apply_inspection_result()
returns trigger as $$
declare
  has_rejection boolean;
  has_restriction boolean;
begin
  select exists (
    select 1 from inspections i
    where i.id = new.inspection_id
      and (
        i.history_fall
        or i.history_chemical_or_abrasive
        or i.history_temperature_out_of_range
        or i.history_unauthorized_modification
      )
  ) or exists (
    select 1
    from inspection_items_result r
    join checklist_items ci on ci.id = r.checklist_item_id
    where r.inspection_id = new.inspection_id
      and (r.status = 'nok' or r.classification in ('AR','R')
        or (r.classification is null and ci.is_critical and r.status = 'nok'))
  ) into has_rejection;

  select exists (
    select 1 from inspection_items_result r
    where r.inspection_id = new.inspection_id and r.classification = 'AV'
  ) into has_restriction;

  update inspections
  set result = case
      when has_rejection then 'rejected'::inspection_result
      when has_restriction then 'approved_with_restriction'::inspection_result
      else result
    end,
    verdict = case
      when has_rejection then 'unfit'
      when has_restriction then 'fit'
      else verdict
    end
  where id = new.inspection_id;
  return new;
end;
$$ language plpgsql;

do $$
declare
  template_id uuid;
begin
  -- Itens que aparecem individualmente nas fichas e não cabiam no resumo inicial.
  select id into template_id from checklist_templates where template_code = 'FP01' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  select template_id, v.section, v.label, v.description, v.order_index, v.is_critical, v.evidence_required
  from (values
    ('Visual','Patilha, eixo e poliamida','Integridade, desgaste, corrosao e deformacao',5,true,true),
    ('Funcional','Abertura completa da patilha','A patilha abre e retorna sem travamento',6,true,true),
    ('Funcional','Mola do mordente','A mola retorna e mantem o mordente funcional',7,true,true)
  ) v(section,label,description,order_index,is_critical,evidence_required)
  where template_id is not null
    and not exists (select 1 from checklist_items i where i.template_id = template_id and i.label = v.label);

  select id into template_id from checklist_templates where template_code = 'FP02' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  select template_id, v.section, v.label, v.description, v.order_index, v.is_critical, v.evidence_required
  from (values
    ('Visual','Roldana, eixo e pino de friccao','Sem desgaste, corrosao, fissuras ou folgas',5,true,true),
    ('Conforto','Protecao PVC','Protecao integra e corretamente posicionada',6,false,false),
    ('Funcional','Abertura e fecho','Fechos e patilha funcionam completamente',7,true,true),
    ('Funcional','Retorno sem atrito','Retorno do manípulo e roldanas sem atrito anormal',8,true,true)
  ) v(section,label,description,order_index,is_critical,evidence_required)
  where template_id is not null
    and not exists (select 1 from checklist_items i where i.template_id = template_id and i.label = v.label);

  select id into template_id from checklist_templates where template_code = 'FP03' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  select template_id, v.section, v.label, v.description, v.order_index, v.is_critical, v.evidence_required
  from (values
    ('Funcional','Abertura completa da patilha','Abertura e retorno sem travamento',5,true,true),
    ('Visual','Fissuras ou deformacoes','Não há dano estrutural no corpo ou absorvedor',6,true,true)
  ) v(section,label,description,order_index,is_critical,evidence_required)
  where template_id is not null
    and not exists (select 1 from checklist_items i where i.template_id = template_id and i.label = v.label);

  select id into template_id from checklist_templates where template_code = 'FP04' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  select template_id, v.section, v.label, v.description, v.order_index, v.is_critical, v.evidence_required
  from (values
    ('Conforto','Protetores de costura','Proteções sem deslocamento ou dano',4,false,false),
    ('Funcional','Mola e desgaste do conector','Mola, trava e acoplamento do MGO funcionam',5,true,true),
    ('Visual','Compatibilidade do conjunto','Componentes compatíveis e sem modificação',6,true,true)
  ) v(section,label,description,order_index,is_critical,evidence_required)
  where template_id is not null
    and not exists (select 1 from checklist_items i where i.template_id = template_id and i.label = v.label);

  select id into template_id from checklist_templates where template_code = 'FP05' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  select template_id, v.section, v.label, v.description, v.order_index, v.is_critical, v.evidence_required
  from (values
    ('Visual','Sulcos, deformacoes e desgaste','Sem dano que reduza a resistência',3,true,true),
    ('Visual','Corrosao, gaiola de passarinho e arames','Sem corrosão relevante, arames saltados ou achatamento',4,true,true)
  ) v(section,label,description,order_index,is_critical,evidence_required)
  where template_id is not null
    and not exists (select 1 from checklist_items i where i.template_id = template_id and i.label = v.label);

  select id into template_id from checklist_templates where template_code = 'FP06' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  select template_id, v.section, v.label, v.description, v.order_index, v.is_critical, v.evidence_required
  from (values
    ('Visual','Fios cortados ou distendidos','Costuras sem fios cortados, distendidos ou soltos',3,true,true),
    ('Visual','Contaminacao e queimadura','Sem contato químico, abrasivo ou queimadura',4,true,true),
    ('Funcional','Ajuste completo','Sistema de ajuste funciona e trava',5,true,true)
  ) v(section,label,description,order_index,is_critical,evidence_required)
  where template_id is not null
    and not exists (select 1 from checklist_items i where i.template_id = template_id and i.label = v.label);

  select id into template_id from checklist_templates where template_code = 'FP07' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  select template_id, v.section, v.label, v.description, v.order_index, v.is_critical, v.evidence_required
  from (values
    ('Identificacao','Comprimento e uso da corda','Registrar comprimento, uso e histórico específico',1,false,false),
    ('Visual','Alma, capa e costuras','Sem corte, desgaste, queimadura ou dano estrutural',4,true,true),
    ('Funcional','Desenvolvimento dos laços','Laços desenvolvem corretamente',5,true,true),
    ('Funcional','Interacao com aparelhos','Compatibilidade e funcionamento com os aparelhos',6,true,true)
  ) v(section,label,description,order_index,is_critical,evidence_required)
  where template_id is not null
    and not exists (select 1 from checklist_items i where i.template_id = template_id and i.label = v.label);

  select id into template_id from checklist_templates where template_code = 'FP08' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  select template_id, v.section, v.label, v.description, v.order_index, v.is_critical, v.evidence_required
  from (values
    ('Visual','Casco e armação','Sem fissura, impacto, deformação ou contaminação',2,true,true),
    ('Visual','Fivelas e retenção','Fivelas e sistema de retenção seguros',5,true,true),
    ('Conforto','Acolchoamento','Acolchoamento íntegro e adequado',6,false,false),
    ('Funcional','Ajustes','Ajustes funcionam e permanecem travados',7,true,true)
  ) v(section,label,description,order_index,is_critical,evidence_required)
  where template_id is not null
    and not exists (select 1 from checklist_items i where i.template_id = template_id and i.label = v.label);

  select id into template_id from checklist_templates where template_code = 'FP09' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  select template_id, v.section, v.label, v.description, v.order_index, v.is_critical, v.evidence_required
  from (values
    ('Visual','Fivelas, conectores e aneis','Fechos, conectores e anéis sem dano ou deformação',3,true,true),
    ('Conforto','Protecoes e acolchoados','Proteções e acolchoados íntegros',4,false,false),
    ('Funcional','Posicao e ajustes','Posição das fivelas e ajustes seguros',5,true,true)
  ) v(section,label,description,order_index,is_critical,evidence_required)
  where template_id is not null
    and not exists (select 1 from checklist_items i where i.template_id = template_id and i.label = v.label);

  select id into template_id from checklist_templates where template_code = 'FP10' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  select template_id, v.section, v.label, v.description, v.order_index, v.is_critical, v.evidence_required
  from (values
    ('Visual','Fitas, costuras e fivelas','Sem cortes, desgaste ou falhas',1,true,true),
    ('Visual','Conectores e aneis','Conectores e anéis sem deformação ou desgaste',2,true,true),
    ('Conforto','Acolchoado e costuras de suporte','Conforto e suporte íntegros',3,false,false),
    ('Funcional','Posicao e ajustes','Posição das fivelas e ajustes seguros',4,true,true)
  ) v(section,label,description,order_index,is_critical,evidence_required)
  where template_id is not null
    and not exists (select 1 from checklist_items i where i.template_id = template_id and i.label = v.label);

  select id into template_id from checklist_templates where template_code = 'FP11' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  select template_id, v.section, v.label, v.description, v.order_index, v.is_critical, v.evidence_required
  from (values
    ('Visual','Corpo, gancho e bico','Sem fissuras, desgaste ou deformação',1,true,true),
    ('Visual','Dedo, rebite e anel','Componentes íntegros e sem folga',2,true,true),
    ('Funcional','Fecho e alinhamento','Dedo alinha com bico e fecha corretamente',3,true,true),
    ('Funcional','Mola e articulacao','Mola e articulação funcionam com segurança',4,true,true)
  ) v(section,label,description,order_index,is_critical,evidence_required)
  where template_id is not null
    and not exists (select 1 from checklist_items i where i.template_id = template_id and i.label = v.label);

  select id into template_id from checklist_templates where template_code = 'FP12' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  select template_id, v.section, v.label, v.description, v.order_index, v.is_critical, v.evidence_required
  from (values
    ('Visual','Placas, roldanas e eixo','Sem fissuras, desgaste, corrosão ou folgas',1,true,true),
    ('Visual','Pino, conjunto movel e manopla','Componentes íntegros e sem deformação',2,true,true),
    ('Funcional','Abertura e fecho da placa','Fecho seguro e funcionamento completo',3,true,true),
    ('Funcional','Teste operacional na corda','Teste sem travamento ou falha na corda',4,true,true)
  ) v(section,label,description,order_index,is_critical,evidence_required)
  where template_id is not null
    and not exists (select 1 from checklist_items i where i.template_id = template_id and i.label = v.label);
end $$;
