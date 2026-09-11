-- FP Vault360 - Sprint 2: estrutura operacional FP

do $$ begin
  create type equipment_owner_type as enum ('fp', 'client');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type catalog_record_status as enum ('active', 'inactive');
exception when duplicate_object then null;
end $$;

create table if not exists clients (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  legal_name text,
  cnpj text,
  email text,
  phone text,
  primary_contact text,
  notes text,
  status catalog_record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);

create unique index if not exists uq_clients_cnpj_tenant
  on clients(tenant_id, cnpj)
  where deleted_at is null and cnpj is not null;
create unique index if not exists uq_clients_name_tenant
  on clients(tenant_id, lower(name))
  where deleted_at is null;

alter table manufacturers add column if not exists status catalog_record_status not null default 'active';
alter table manufacturers add column if not exists notes text;
create unique index if not exists uq_manufacturers_name_tenant
  on manufacturers(tenant_id, lower(name))
  where deleted_at is null;

alter table equipment add column if not exists owner_type equipment_owner_type not null default 'fp';
alter table equipment add column if not exists client_id uuid references clients(id);
do $$ begin
  alter table equipment add constraint chk_equipment_client_owner
    check ((owner_type = 'client' and client_id is not null) or (owner_type = 'fp' and client_id is null));
exception when duplicate_object then null;
end $$;
create index if not exists idx_equipment_client on equipment(tenant_id, client_id) where deleted_at is null;
create index if not exists idx_equipment_owner on equipment(tenant_id, owner_type) where deleted_at is null;

alter table kits add column if not exists client_id uuid references clients(id);
alter table kits add column if not exists description text;
create index if not exists idx_kits_client on kits(tenant_id, client_id) where deleted_at is null;

insert into roles (tenant_id, code, name, level, is_system)
select null, v.code, v.name, v.level, true
from (values
  ('sup_master', 'SUP_Master', 0),
  ('master01', 'Master01', 1),
  ('master02', 'Master02', 1),
  ('master03', 'Master03', 1),
  ('submaster', 'SubMaster', 2)
) as v(code, name, level)
where not exists (
  select 1 from roles r where r.tenant_id is null and r.code = v.code
);

alter table clients enable row level security;
do $$ begin
  create policy clients_tenant_access on clients
    for all using (fn_is_super_master() or tenant_id = fn_current_user_tenant())
    with check (fn_is_super_master() or tenant_id = fn_current_user_tenant());
exception when duplicate_object then null;
end $$;

drop trigger if exists trg_clients_updated_at on clients;
create trigger trg_clients_updated_at before update on clients
  for each row execute function fn_set_updated_at();

drop trigger if exists trg_manufacturers_updated_at on manufacturers;
create trigger trg_manufacturers_updated_at before update on manufacturers
  for each row execute function fn_set_updated_at();

create or replace function fn_validate_client_tenant_link()
returns trigger as $$
declare
  client_tenant_id uuid;
begin
  if new.client_id is null then
    return new;
  end if;

  select tenant_id into client_tenant_id from clients where id = new.client_id;
  if client_tenant_id is null or client_tenant_id <> new.tenant_id then
    raise exception 'Cliente deve pertencer ao mesmo tenant do registro';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_equipment_client_tenant on equipment;
create trigger trg_equipment_client_tenant
before insert or update of client_id, tenant_id on equipment
for each row execute function fn_validate_client_tenant_link();

drop trigger if exists trg_kits_client_tenant on kits;
create trigger trg_kits_client_tenant
before insert or update of client_id, tenant_id on kits
for each row execute function fn_validate_client_tenant_link();

