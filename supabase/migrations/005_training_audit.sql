-- ============================================================================
-- FP VAULT360° — MIGRATION 005: TREINAMENTOS E AUDITORIA
-- ============================================================================

create table certifications (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id), -- NULL = catálogo global (NR35, IRATA, ANEAC, GWO...)
  name text not null, -- 'NR35','IRATA','ANEAC','GWO','Espaço Confinado','Resgate'
  category text,
  validity_months int
);
create table trainings (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  certification_id uuid references certifications(id),
  provider text,
  created_at timestamptz not null default now()
);
create table user_certifications (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  user_id uuid not null references users(id),
  training_id uuid references trainings(id),
  certification_id uuid references certifications(id),
  issued_at date not null,
  expires_at date,
  document_id uuid references documents(id),
  status text not null default 'valid' check (status in ('valid', 'expiring_soon', 'expired')),
  created_at timestamptz not null default now()
);
create index idx_user_cert_expiry on user_certifications(tenant_id, expires_at);
create or replace function fn_set_user_certification_status()
returns trigger as $$
begin
  new.status = case
    when new.expires_at is null then 'valid'
    when new.expires_at < current_date then 'expired'
    when new.expires_at < current_date + 30 then 'expiring_soon'
    else 'valid'
  end;
  return new;
end;
$$ language plpgsql;
create trigger trg_user_certification_status
  before insert or update of expires_at on user_certifications
  for each row execute function fn_set_user_certification_status();
-- ----------------------------------------------------------------------------
-- AUDITORIAS E PLANOS DE AÇÃO
-- ----------------------------------------------------------------------------
create table audits (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  title text not null,
  scope text,
  auditor_id uuid references users(id),
  started_at date not null default current_date,
  finished_at date,
  status text not null default 'in_progress' check (status in ('in_progress','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);
create table nonconformities (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  audit_id uuid references audits(id),
  equipment_id uuid references equipment(id),
  description text not null,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','in_progress','resolved','cancelled')),
  identified_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_by uuid
);
create table action_plans (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  nonconformity_id uuid not null references nonconformities(id) on delete cascade,
  description text not null,
  responsible_user_id uuid references users(id),
  due_date date,
  status text not null default 'pending' check (status in ('pending','in_progress','done','overdue')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create trigger trg_audits_updated_at before update on audits
  for each row execute function fn_set_updated_at();
