alter table users add column if not exists client_id uuid references clients(id);
create index if not exists idx_users_client on users(tenant_id, client_id) where deleted_at is null;

insert into permissions (module, action)
select 'users', 'manage'
where not exists (select 1 from permissions where code = 'users:manage');

insert into roles (tenant_id, code, name, level, is_system)
select null, 'client_portal', 'Acesso de Cliente', 5, true
where not exists (select 1 from roles where tenant_id is null and code = 'client_portal');
