create table if not exists inspection_change_requests (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  inspection_id uuid not null references inspections(id) on delete cascade,
  requested_by uuid not null references users(id),
  approved_by uuid references users(id),
  previous_data jsonb not null default '{}'::jsonb,
  proposed_data jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists idx_inspection_change_requests_inspection
  on inspection_change_requests(tenant_id, inspection_id, created_at desc);

alter table inspection_change_requests enable row level security;
drop policy if exists inspection_change_requests_tenant_access on inspection_change_requests;
create policy inspection_change_requests_tenant_access on inspection_change_requests
  for all using (fn_is_super_master() or tenant_id = fn_current_user_tenant())
  with check (fn_is_super_master() or tenant_id = fn_current_user_tenant());