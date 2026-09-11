-- FP Vault360 - Sprint 04: serviÃ§os operacionais e controle de acesso

alter table users
  add column if not exists must_change_password boolean not null default false;

create table if not exists services (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  client_id uuid not null references clients(id),
  work_order text not null,
  requested_at date not null default current_date,
  received_at date,
  status text not null default 'received'
    check (status in ('received','in_inspection','in_maintenance','completed','delivered','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users(id),
  updated_by uuid references users(id),
  deleted_at timestamptz
);

alter table equipment add column if not exists service_id uuid references services(id);
create index if not exists idx_services_tenant_status on services(tenant_id, status) where deleted_at is null;
create index if not exists idx_services_client on services(tenant_id, client_id) where deleted_at is null;
create index if not exists idx_equipment_service on equipment(tenant_id, service_id) where deleted_at is null;

drop trigger if exists trg_services_updated_at on services;
create trigger trg_services_updated_at before update on services
for each row execute function fn_set_updated_at();

create or replace function fn_validate_service_tenant_link()
returns trigger as $$
declare
  service_tenant_id uuid;
  service_client_id uuid;
begin
  select tenant_id, client_id into service_tenant_id, service_client_id from services where id = new.service_id;
  if service_tenant_id is null or service_tenant_id <> new.tenant_id
     or new.owner_type = 'client' and service_client_id <> new.client_id then
    raise exception 'ServiÃ§o deve pertencer ao mesmo tenant e cliente do equipamento';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_equipment_service_tenant on equipment;
create trigger trg_equipment_service_tenant
before insert or update of service_id, client_id, owner_type, tenant_id on equipment
for each row when (new.service_id is not null)
execute function fn_validate_service_tenant_link();

alter table services enable row level security;
do $$ begin
  create policy services_tenant_access on services
    for all using (fn_is_super_master() or tenant_id = fn_current_user_tenant())
    with check (fn_is_super_master() or tenant_id = fn_current_user_tenant());
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table equipment add constraint chk_equipment_client_service
    check (owner_type <> 'client' or service_id is not null);
exception when duplicate_object then null;
end $$;

insert into permissions (module, action)
select module, action from (values
  ('clients','view'),('clients','create'),('clients','update'),('clients','delete'),
  ('services','view'),('services','create'),('services','update'),('services','delete'),
  ('reports','view'),('reports','export')
) as p(module, action)
on conflict (code) do nothing;

insert into roles (tenant_id, code, name, level, is_system)
select null, v.code, v.name, v.level, true
from (values
  ('master01', 'Master01', 1),
  ('master02', 'Master02', 1),
  ('master03', 'Master03', 1),
  ('submaster', 'Sub Master', 2)
) as v(code, name, level)
where not exists (select 1 from roles r where r.tenant_id is null and r.code = v.code);

