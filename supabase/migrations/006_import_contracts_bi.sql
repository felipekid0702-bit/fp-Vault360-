-- ============================================================================
-- FP VAULT360° — MIGRATION 006: IMPORTAÇÃO, CONTRATOS, NOTIFICAÇÕES, BI
-- ============================================================================

-- ----------------------------------------------------------------------------
-- IMPORTAÇÃO EM MASSA
-- ----------------------------------------------------------------------------
create table import_layouts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  name text not null, -- ex: "Planilha SAP", "Planilha TOTVS"
  entity text not null check (entity in ('equipment','kits','users','trainings')),
  field_mapping jsonb not null default '{}'::jsonb, -- {"Fabricante":"manufacturer","Nº Série":"serial_number"}
  created_at timestamptz not null default now(),
  created_by uuid
);
create table import_jobs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  entity text not null,
  layout_id uuid references import_layouts(id),
  file_path text not null,
  status text not null default 'queued' check (status in ('queued','validating','ready','processing','completed','failed','rolled_back')),
  total_rows int default 0,
  valid_rows int default 0,
  error_rows int default 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);
create table import_errors (
  id uuid primary key default uuid_generate_v4(),
  import_job_id uuid not null references import_jobs(id) on delete cascade,
  row_number int not null,
  field text,
  message text not null
);
-- ----------------------------------------------------------------------------
-- CONTRATOS (Modo Prestador de Serviço / Híbrido)
-- ----------------------------------------------------------------------------
create table contracts (
  id uuid primary key default uuid_generate_v4(),
  fp_tenant_id uuid not null references tenants(id), -- sempre o tenant master
  client_tenant_id uuid not null references tenants(id),
  contract_number text,
  scope text,
  sla_days int,
  responsible_team text,
  equipment_quantity int,
  inspection_frequency text, -- ex: 'monthly','quarterly'
  start_date date not null,
  end_date date,
  status text not null default 'active' check (status in ('active','suspended','ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table contract_scopes (
  id uuid primary key default uuid_generate_v4(),
  contract_id uuid not null references contracts(id) on delete cascade,
  description text not null,
  category_id uuid references equipment_categories(id)
);
create trigger trg_contracts_updated_at before update on contracts
  for each row execute function fn_set_updated_at();
-- ----------------------------------------------------------------------------
-- NOTIFICAÇÕES
-- ----------------------------------------------------------------------------
create table notification_rules (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  event text not null, -- 'inspection_due','training_due','equipment_rejected','manufacturer_recall'
  channels notification_channel[] not null default '{email}',
  days_before int default 0,
  active boolean not null default true
);
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  user_id uuid references users(id),
  channel notification_channel not null,
  title text not null,
  body text,
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on notifications(user_id, read_at);
-- ----------------------------------------------------------------------------
-- BI — VIEWS E FUNÇÕES (dashboards nunca calculam agregados no frontend)
-- ----------------------------------------------------------------------------
create or replace view v_equipment_summary as
select
  tenant_id,
  count(*) filter (where deleted_at is null) as total_active,
  count(*) filter (where status = 'active') as total_operational,
  count(*) filter (where status = 'blocked') as total_blocked,
  count(*) filter (where status = 'quarantine') as total_quarantine,
  count(*) filter (where expiration_date < current_date) as total_expired,
  count(*) filter (where expiration_date between current_date and current_date + interval '30 days') as total_expiring_soon
from equipment
group by tenant_id;
create or replace view v_compliance_rate as
select
  i.tenant_id,
  count(*) as total_inspections,
  count(*) filter (where i.result = 'approved') as approved,
  count(*) filter (where i.result = 'rejected') as rejected,
  round(
    (count(*) filter (where i.result = 'approved'))::numeric
    / nullif(count(*), 0) * 100, 2
  ) as compliance_percent
from inspections i
where i.deleted_at is null
group by i.tenant_id;
create or replace view v_training_status as
select
  tenant_id,
  count(*) filter (where status = 'valid') as valid_count,
  count(*) filter (where status = 'expiring_soon') as expiring_soon_count,
  count(*) filter (where status = 'expired') as expired_count
from user_certifications
group by tenant_id;
create or replace view v_fp_operations_summary as
-- Dashboard exclusivo da FP (modo Prestador de Serviço)
select
  c.fp_tenant_id,
  count(distinct c.client_tenant_id) as total_clients,
  count(distinct c.id) filter (where c.status = 'active') as active_contracts,
  (select count(*) from equipment e where e.tenant_id in (select client_tenant_id from contracts where fp_tenant_id = c.fp_tenant_id)) as equipment_under_management
from contracts c
group by c.fp_tenant_id;
