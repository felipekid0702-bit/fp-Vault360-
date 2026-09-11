-- FP VAULT360 - MIGRATION 010: MODELO OFICIAL DE INSPECAO FP
-- Adiciona classificacao FP sem remover compatibilidade com status legado.

alter table checklist_templates
  add column if not exists template_code text,
  add column if not exists objective text,
  add column if not exists source_document text;

create unique index if not exists uq_checklist_templates_global_code
  on checklist_templates(template_code)
  where tenant_id is null and template_code is not null;

alter table checklist_items
  add column if not exists section text,
  add column if not exists required boolean not null default true,
  add column if not exists evidence_required boolean not null default false;

alter table inspection_items_result
  add column if not exists classification text,
  add column if not exists action_required text,
  add constraint inspection_item_classification_check
    check (classification is null or classification in ('C','B','AV','AR','R'));

alter table inspections
  add column if not exists history_notes text,
  add column if not exists inspection_location text,
  add column if not exists verdict text,
  add constraint inspections_verdict_check
    check (verdict is null or verdict in ('fit','unfit'));

create or replace function fn_apply_inspection_result()
returns trigger as $$
declare
  has_rejection boolean;
  has_restriction boolean;
begin
  select exists (
    select 1
    from inspection_items_result r
    join checklist_items ci on ci.id = r.checklist_item_id
    where r.inspection_id = new.inspection_id
      and (
        r.status = 'nok'
        or r.classification in ('AR','R')
        or (r.classification is null and ci.is_critical = true and r.status = 'nok')
      )
  ) into has_rejection;

  select exists (
    select 1
    from inspection_items_result r
    where r.inspection_id = new.inspection_id
      and r.classification = 'AV'
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

-- Templates oficiais globais. Os itens são criados em blocos idempotentes para
-- permitir reexecucao segura em ambientes que ja possuam parte do catalogo.
do $$
declare
  template_id uuid;
begin
  insert into checklist_templates (template_code, name, objective, source_document, inspection_type, active)
  values ('FP01', 'FP01 - Ascensor', 'Verificar integridade e bloqueio do ascensor', 'FP01_Ascensor.pdf.pdf', 'periodic', true)
  on conflict do nothing returning id into template_id;
  select id into template_id from checklist_templates where template_code = 'FP01' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  values
    (template_id,'Visual','Estado do corpo','Desgaste, corrosao, sulcos, deformacoes e fissuras',1,true,true),
    (template_id,'Visual','Estado do batente anti-retorno','Desgaste, corrosao, sulcos, deformacoes e fissuras',2,true,true),
    (template_id,'Visual','Estado do mordente e rebites','Dentes gastos/ausentes, fissuras, marcas, desgaste e corrosao',3,true,true),
    (template_id,'Funcional','Bloqueio e molas','Desliza para cima, bloqueia para baixo e molas funcionam',4,true,true);

  insert into checklist_templates (template_code, name, objective, source_document, inspection_type, active)
  values ('FP02', 'FP02 - Descensor', 'Verificar placas, atrito, manopla e fechos do descensor', 'FP02_Descensor.pdf.pdf', 'periodic', true)
  on conflict do nothing;
  select id into template_id from checklist_templates where template_code = 'FP02' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  values
    (template_id,'Visual','Placas e partes moveis','Desgaste, corrosao, sulcos, deformacoes e fissuras',1,true,true),
    (template_id,'Visual','Elementos de atrito','Superficie das roldanas, eixo e pino de friccao',2,true,true),
    (template_id,'Visual','Elementos de fecho','Patilha, rebites, pinos, eixo e porcas',3,true,true),
    (template_id,'Funcional','Teste operacional na corda','Retorno, abertura, fecho e funcionamento sem atrito',4,true,true);

  insert into checklist_templates (template_code, name, objective, source_document, inspection_type, active)
  values ('FP03', 'FP03 - Trava-quedas', 'Verificar bloqueio, patilha e absorvedor', 'FP03_TravaQuedas.pdf.pdf', 'periodic', true)
  on conflict do nothing;
  select id into template_id from checklist_templates where template_code = 'FP03' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  values
    (template_id,'Visual','Corpo e batente','Desgaste, corrosao, sulcos, deformacoes e fissuras',1,true,true),
    (template_id,'Visual','Mordente, rebites e patilha','Dentes, rebites, eixo, poliamida e seguranca',2,true,true),
    (template_id,'Visual','Absorvedor de energia','Sem desgaste, fios soltos, contaminacao ou protecao afetada',3,true,true),
    (template_id,'Funcional','Bloqueio e molas','Desliza, bloqueia, molas e abertura da patilha',4,true,true);

  insert into checklist_templates (template_code, name, objective, source_document, inspection_type, active)
  values ('FP04', 'FP04 - Talabarte', 'Verificar fitas, costuras, conectores e acoplamento', 'FP04_Talabarte.pdf.pdf', 'periodic', true)
  on conflict do nothing;
  select id into template_id from checklist_templates where template_code = 'FP04' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  values
    (template_id,'Visual','Fita ou corda','Cortes, desgaste, queimadura, contaminacao e marcas',1,true,true),
    (template_id,'Visual','Costuras e metais','Fios, conector e pecas metalicas sem dano',2,true,true),
    (template_id,'Funcional','Sistema de acoplamento','Gancho MGO, mola, desgaste e corrosao',3,true,true);

  insert into checklist_templates (template_code, name, objective, source_document, inspection_type, active)
  values ('FP05', 'FP05 - Elemento metalico', 'Verificar corpo, olhais e alinhamento', 'FP05_ElementoMetalico.pdf.pdf', 'periodic', true)
  on conflict do nothing;
  select id into template_id from checklist_templates where template_code = 'FP05' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  values
    (template_id,'Visual','Corpo e olhais','Fissuras, sulcos, deformacoes, desgaste, corrosao e arames',1,true,true),
    (template_id,'Funcional','Alinhamento','Verificar correto alinhamento',2,true,true);

  insert into checklist_templates (template_code, name, objective, source_document, inspection_type, active)
  values ('FP06', 'FP06 - Elemento textil', 'Verificar fitas, costuras e ajustes', 'FP06_ElementoTextil.pdf.pdf', 'periodic', true)
  on conflict do nothing;
  select id into template_id from checklist_templates where template_code = 'FP06' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  values
    (template_id,'Visual','Fitas','Cortes, desgaste e queimaduras',1,true,true),
    (template_id,'Visual','Costuras','Fios cortados, distendidos ou desgastados',2,true,true),
    (template_id,'Funcional','Ajuste','Funcionamento do ajuste',3,true,true);

  insert into checklist_templates (template_code, name, objective, source_document, inspection_type, active)
  values ('FP07', 'FP07 - Corda', 'Verificar corda, costuras, laços e aparelhos', 'FP07_Corda.pdf.pdf', 'periodic', true)
  on conflict do nothing;
  select id into template_id from checklist_templates where template_code = 'FP07' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  values
    (template_id,'Visual','Corda e costuras','Cortes, desgaste, queimaduras e costuras',1,true,true),
    (template_id,'Funcional','Desenvolvimento dos laços','Bom desenvolvimento nos laços',2,true,true),
    (template_id,'Funcional','Interacao com aparelhos','Bom desenvolvimento com os aparelhos',3,true,true);

  insert into checklist_templates (template_code, name, objective, source_document, inspection_type, active)
  values ('FP08', 'FP08 - Capacete', 'Verificar casco, fitas, componentes e ajustes', 'FP08_Capacete.pdf.pdf', 'periodic', true)
  on conflict do nothing;
  select id into template_id from checklist_templates where template_code = 'FP08' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  values
    (template_id,'Visual','Casco','Fissuras, marcas, queimaduras e contaminacao',1,true,true),
    (template_id,'Visual','Fitas, costuras e fivelas','Integridade da retencao e componentes',2,true,true),
    (template_id,'Funcional','Ajustes','Funcionamento dos ajustes',3,true,true);

  insert into checklist_templates (template_code, name, objective, source_document, inspection_type, active)
  values ('FP09', 'FP09 - Cinto de seguranca', 'Verificar fitas, costuras, fivelas, aneis e ajustes', 'FP09_CintoSeguranca.pdf.pdf', 'periodic', true)
  on conflict do nothing;
  select id into template_id from checklist_templates where template_code = 'FP09' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  values
    (template_id,'Visual','Fitas e costuras','Cortes, desgaste, queimaduras e fios comprometidos',1,true,true),
    (template_id,'Visual','Fivelas, conector e aneis','Deformacao, sulco, desgaste, corrosao e compatibilidade',2,true,true),
    (template_id,'Funcional','Ajustes','Posicao das fivelas e funcionamento dos ajustes',3,true,true);

  insert into checklist_templates (template_code, name, objective, source_document, inspection_type, active)
  values ('FP10', 'FP10 - Assento conforto', 'Verificar acessorio, conforto e ajustes', 'FP10_AssentoConforto.pdf.pdf', 'periodic', true)
  on conflict do nothing;
  select id into template_id from checklist_templates where template_code = 'FP10' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  values
    (template_id,'Visual','Fitas, costuras e aneis','Integridade, deformacao, desgaste e corrosao',1,true,true),
    (template_id,'Conforto','Acolchoado e suporte','Estado do acolchoado e costuras de suporte',2,false,true),
    (template_id,'Funcional','Ajustes','Posicao das fivelas e funcionamento',3,true,true);

  insert into checklist_templates (template_code, name, objective, source_document, inspection_type, active)
  values ('FP11', 'FP11 - Conector', 'Verificar corpo, fecho, mola e seguranca', 'FP11_Conector.pdf.pdf', 'periodic', true)
  on conflict do nothing;
  select id into template_id from checklist_templates where template_code = 'FP11' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  values
    (template_id,'Visual','Corpo, gancho e bico','Fissuras, sulcos, deformacoes, desgaste e corrosao',1,true,true),
    (template_id,'Visual','Dedo, rebite e anel','Integridade do fecho',2,true,true),
    (template_id,'Funcional','Fecho e sistema de seguranca','Alinhamento, mola, articulacao e seguranca',3,true,true);

  insert into checklist_templates (template_code, name, objective, source_document, inspection_type, active)
  values ('FP12', 'FP12 - Polia', 'Verificar placas, roldanas, fechos e teste na corda', 'FP12_Polia.pdf.pdf', 'periodic', true)
  on conflict do nothing;
  select id into template_id from checklist_templates where template_code = 'FP12' and tenant_id is null;
  insert into checklist_items (template_id, section, label, description, order_index, is_critical, evidence_required)
  values
    (template_id,'Visual','Placas e roldanas','Desgaste, corrosao, sulcos, deformacoes e fissuras',1,true,true),
    (template_id,'Visual','Elementos de fecho','Patilha, rebites e porcas',2,true,true),
    (template_id,'Funcional','Abertura, fecho e teste na corda','Funcionamento das placas e teste operacional',3,true,true);
end $$;
