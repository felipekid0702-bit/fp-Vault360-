-- ============================================================================
-- FP VAULT360° — MIGRATION 003: CHECKLISTS DINÂMICOS E INSPEÇÕES
-- ============================================================================
-- Padrão de inspeção: checklist 100% configurável via banco, nunca hardcoded.

create table checklist_templates (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id), -- NULL = template global padrão (herdável por tenants)
  category_id uuid references equipment_categories(id),
  name text not null, -- ex: "Checklist Cordas"
  inspection_type inspection_type not null default 'periodic',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);

create table checklist_items (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid not null references checklist_templates(id) on delete cascade,
  label text not null, -- ex: "capa externa", "alma", "contaminação química"
  description text,
  order_index int not null default 0,
  is_critical boolean not null default false, -- reprovação automática se marcado NOK
  created_at timestamptz not null default now()
);

alter table equipment_categories
  add constraint fk_category_checklist foreign key (checklist_template_id)
  references checklist_templates(id);

create table inspections (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  equipment_id uuid not null references equipment(id),
  kit_id uuid, -- referência opcional, FK adicionada na migration 004
  template_id uuid references checklist_templates(id),
  type inspection_type not null,
  inspector_id uuid not null references users(id),
  performed_at timestamptz not null default now(),
  performed_by_org text default 'client', -- 'fp' ou 'client' (rastreio em modo híbrido)
  result inspection_result,
  notes text,
  next_due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz
);
create index idx_inspections_tenant on inspections(tenant_id) where deleted_at is null;
create index idx_inspections_equipment on inspections(equipment_id);
create index idx_inspections_due on inspections(tenant_id, next_due_date);

create table inspection_items_result (
  id uuid primary key default uuid_generate_v4(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  checklist_item_id uuid not null references checklist_items(id),
  status text not null check (status in ('ok','nok','na')),
  observation text
);

create table inspection_evidences (
  id uuid primary key default uuid_generate_v4(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table inspection_signatures (
  id uuid primary key default uuid_generate_v4(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  signer_user_id uuid not null references users(id),
  signature_image_path text,
  signed_at timestamptz not null default now()
);

create trigger trg_inspections_updated_at before update on inspections
  for each row execute function fn_set_updated_at();

-- Regra: item crítico marcado 'nok' força resultado 'rejected' na inspeção
create or replace function fn_apply_inspection_result()
returns trigger as $$
declare
  has_critical_fail boolean;
begin
  select exists (
    select 1 from inspection_items_result r
    join checklist_items ci on ci.id = r.checklist_item_id
    where r.inspection_id = new.inspection_id and r.status = 'nok' and ci.is_critical = true
  ) into has_critical_fail;

  if has_critical_fail then
    update inspections set result = 'rejected' where id = new.inspection_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_inspection_item_result after insert or update on inspection_items_result
  for each row execute function fn_apply_inspection_result();
