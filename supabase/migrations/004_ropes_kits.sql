-- ============================================================================
-- FP VAULT360° — MIGRATION 004: GESTÃO DE CORDAS E KITS
-- ============================================================================

create table rope_details (
  equipment_id uuid primary key references equipment(id) on delete cascade,
  tenant_id uuid not null references tenants(id),
  original_length_m numeric(6,2) not null,
  current_length_m numeric(6,2) not null,
  wear_percent numeric(5,2) generated always as (
    case when original_length_m > 0
      then round(((original_length_m - current_length_m) / original_length_m) * 100, 2)
      else 0 end
  ) stored,
  retired boolean not null default false,
  retired_at timestamptz,
  retired_reason text
);
create table rope_cuts (
  id uuid primary key default uuid_generate_v4(),
  equipment_id uuid not null references equipment(id) on delete cascade,
  tenant_id uuid not null references tenants(id),
  cut_length_m numeric(6,2) not null,
  reason text,
  performed_by uuid references users(id),
  performed_at timestamptz not null default now()
);
create table rope_usage_history (
  id uuid primary key default uuid_generate_v4(),
  equipment_id uuid not null references equipment(id) on delete cascade,
  tenant_id uuid not null references tenants(id),
  event_type text not null, -- 'use','inspection','cut','retirement'
  description text,
  occurred_at timestamptz not null default now(),
  recorded_by uuid references users(id)
);
-- Atualiza current_length_m automaticamente ao registrar um corte
create or replace function fn_apply_rope_cut()
returns trigger as $$
begin
  update rope_details
    set current_length_m = current_length_m - new.cut_length_m
    where equipment_id = new.equipment_id;

  insert into rope_usage_history (equipment_id, tenant_id, event_type, description, recorded_by)
    values (new.equipment_id, new.tenant_id, 'cut',
            format('Corte de %s m — %s', new.cut_length_m, coalesce(new.reason, 'sem motivo informado')),
            new.performed_by);
  return new;
end;
$$ language plpgsql;
create trigger trg_rope_cut after insert on rope_cuts
  for each row execute function fn_apply_rope_cut();
-- ----------------------------------------------------------------------------
-- KITS
-- ----------------------------------------------------------------------------
create table kits (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  code text,
  category text, -- ex: "Kit Resgate"
  parent_equipment_id uuid references equipment(id), -- equipamento "pai" do kit, se aplicável
  responsible_user_id uuid references users(id),
  location_id uuid references locations(id),
  status equipment_status not null default 'active', -- derivado dos componentes (ver função abaixo)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz
);
create table kit_items (
  kit_id uuid not null references kits(id) on delete cascade,
  equipment_id uuid not null references equipment(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (kit_id, equipment_id)
);
alter table inspections
  add constraint fk_inspections_kit foreign key (kit_id) references kits(id);
-- Status do kit = pior status entre os componentes
create or replace function fn_recalc_kit_status(p_kit_id uuid)
returns void as $$
declare
  worst equipment_status;
begin
  select
    case
      when bool_or(e.status = 'blocked') then 'blocked'
      when bool_or(e.status = 'quarantine') then 'quarantine'
      when bool_or(e.status = 'retired') then 'retired'
      when bool_or(e.status = 'lost') then 'lost'
      else 'active'
    end::equipment_status
  into worst
  from kit_items ki join equipment e on e.id = ki.equipment_id
  where ki.kit_id = p_kit_id;

  update kits set status = coalesce(worst, 'active') where id = p_kit_id;
end;
$$ language plpgsql;
create or replace function fn_trigger_kit_status()
returns trigger as $$
begin
  perform fn_recalc_kit_status(coalesce(new.kit_id, old.kit_id));
  return coalesce(new, old);
end;
$$ language plpgsql;
create trigger trg_kit_items_status after insert or delete on kit_items
  for each row execute function fn_trigger_kit_status();
create trigger trg_kits_updated_at before update on kits
  for each row execute function fn_set_updated_at();
