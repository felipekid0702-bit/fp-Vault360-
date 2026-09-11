-- FP VAULT360 - MIGRATION 012: CICLO OPERACIONAL, RASTREABILIDADE E LAUDOS

create table if not exists equipment_movements (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  equipment_id uuid not null references equipment(id),
  movement_type text not null check (movement_type in ('stock','dispatch','unit_transfer','return','inspection_release','quarantine','maintenance','disposal')),
  from_location_id uuid references locations(id),
  to_location_id uuid references locations(id),
  from_tenant_id uuid references tenants(id),
  to_tenant_id uuid references tenants(id),
  responsible_user_id uuid references users(id),
  occurred_at timestamptz not null default now(),
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists maintenance_records (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  equipment_id uuid not null references equipment(id),
  inspection_id uuid references inspections(id),
  maintenance_type text not null check (maintenance_type in ('preventive','corrective','repair','cleaning','reinspection')),
  status text not null default 'open' check (status in ('open','in_progress','completed','cancelled')),
  description text not null,
  performed_by uuid references users(id),
  started_at timestamptz,
  completed_at timestamptz,
  evidence_path text,
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists quarantine_cases (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  equipment_id uuid not null references equipment(id),
  inspection_id uuid references inspections(id),
  reason text not null,
  status text not null default 'quarantined' check (status in ('quarantined','under_analysis','repair','released','discarded')),
  analysis_notes text,
  decision text check (decision in ('repair','release','discard')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opened_by uuid references users(id),
  closed_by uuid references users(id)
);

create table if not exists disposal_records (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  equipment_id uuid not null references equipment(id),
  quarantine_case_id uuid references quarantine_cases(id),
  reason text not null,
  evidence_path text not null,
  disposed_at timestamptz not null default now(),
  disposed_by uuid references users(id),
  notes text
);

create table if not exists inspection_reports (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  inspection_id uuid not null unique references inspections(id) on delete cascade,
  report_number text not null unique,
  generated_at timestamptz not null default now(),
  generated_by uuid references users(id),
  document_path text,
  signed_at timestamptz,
  signed_by uuid references users(id)
);

create table if not exists competency_catalog (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  name text not null,
  description text,
  validity_months int
);

create table if not exists user_competencies (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  user_id uuid not null references users(id),
  competency_id uuid not null references competency_catalog(id),
  issued_at date not null,
  expires_at date,
  document_id uuid references documents(id),
  issuer_user_id uuid references users(id),
  status text not null default 'valid' check (status in ('valid','expiring_soon','expired')),
  created_at timestamptz not null default now()
);

create or replace function fn_set_user_competency_status()
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

drop trigger if exists trg_user_competency_status on user_competencies;
create trigger trg_user_competency_status
before insert or update of expires_at on user_competencies
for each row execute function fn_set_user_competency_status();

alter table user_certifications
  add column if not exists issued_by uuid references users(id),
  add column if not exists renewal_of uuid references user_certifications(id),
  add column if not exists document_path text;

insert into competency_catalog (code, name, description) values
  ('inspector_level_1','Inspetor Nível 1','Executa inspeções sob procedimento aprovado'),
  ('competent_inspector','Inspetor Competente','Avalia equipamentos e decisões técnicas'),
  ('supervisor','Supervisor','Revisa resultados e libera equipamentos'),
  ('administrator','Administrador','Administra operação e documentos')
on conflict (code) do nothing;

create or replace function fn_open_quarantine_after_inspection()
returns trigger as $$
begin
  if new.result = 'rejected' or new.verdict = 'unfit' then
    update equipment set status = 'quarantine' where id = new.equipment_id;
    insert into quarantine_cases (tenant_id, equipment_id, inspection_id, reason, opened_by)
    select new.tenant_id, new.equipment_id, new.id,
      coalesce(new.notes, 'Inspeção FP resultou em INAPTO'),
      new.inspector_id
    where not exists (
      select 1 from quarantine_cases q
      where q.inspection_id = new.id
    );
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_open_quarantine_after_inspection on inspections;
create trigger trg_open_quarantine_after_inspection
after insert or update of result, verdict on inspections
for each row execute function fn_open_quarantine_after_inspection();

create or replace view v_fp_traceability as
select e.id as equipment_id, e.tenant_id, e.internal_code, e.serial_number, e.model, e.status,
  (select max(i.performed_at) from inspections i where i.equipment_id = e.id and i.deleted_at is null) as last_inspection_at,
  (select max(m.occurred_at) from equipment_movements m where m.equipment_id = e.id) as last_movement_at,
  (select max(q.opened_at) from quarantine_cases q where q.equipment_id = e.id) as last_quarantine_at,
  (select max(d.disposed_at) from disposal_records d where d.equipment_id = e.id) as disposed_at
from equipment e
where e.deleted_at is null;

create or replace view v_fp_executive_summary as
select
  e.tenant_id,
  count(*) filter (where e.status = 'quarantine') as quarantine_count,
  count(*) filter (where e.status = 'retired') as retired_count,
  count(*) filter (where e.expiration_date < current_date) as expired_count,
  count(*) filter (where e.expiration_date between current_date and current_date + interval '30 days') as expiring_count,
  (select count(*) from inspections i where i.tenant_id = e.tenant_id and i.performed_at >= current_date - interval '30 days') as inspections_last_30_days,
  (select count(*) from inspections i where i.tenant_id = e.tenant_id and i.result = 'rejected' and i.performed_at >= current_date - interval '30 days') as rejected_last_30_days
from equipment e
where e.deleted_at is null
group by e.tenant_id;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['equipment_movements','maintenance_records','quarantine_cases','disposal_records','inspection_reports','user_competencies'] loop
    execute format('alter table %I enable row level security', table_name);
    execute format('drop policy if exists %I on %I', table_name || '_tenant_isolation', table_name);
    execute format('create policy %I on %I for all using (fn_is_super_master() or tenant_id = fn_current_user_tenant()) with check (fn_is_super_master() or tenant_id = fn_current_user_tenant())', table_name || '_tenant_isolation', table_name);
  end loop;
end $$;
