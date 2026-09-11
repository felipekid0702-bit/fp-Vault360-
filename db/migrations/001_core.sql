-- ============================================================================
-- FP VAULT360° — MIGRATION 001: NÚCLEO (Tenants, Usuários, RBAC, Super Master)
-- ============================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
do $$ begin
  create type operation_mode as enum ('service_provider', 'autonomous', 'hybrid');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type tenant_status as enum ('active', 'suspended', 'trial', 'cancelled');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type equipment_status as enum ('active', 'quarantine', 'blocked', 'retired', 'lost');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type inspection_type as enum ('acquisition', 'pre_use', 'periodic', 'extraordinary', 'post_fall');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type inspection_result as enum ('approved', 'approved_with_restriction', 'rejected');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type notification_channel as enum ('email', 'whatsapp', 'push');
exception when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------------------
-- TENANTS
-- ----------------------------------------------------------------------------
create table tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  legal_name text,
  cnpj text,
  operation_mode operation_mode not null default 'autonomous',
  status tenant_status not null default 'trial',
  is_master boolean not null default false, -- true apenas para o tenant FP
  parent_tenant_id uuid references tenants(id), -- para hierarquias de unidades/filiais
  logo_url text,
  primary_color text default '#4F7A5C',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);
create unique index uq_tenants_master on tenants (is_master) where is_master = true;
create index idx_tenants_status on tenants(status) where deleted_at is null;

-- ----------------------------------------------------------------------------
-- PLATFORM SETTINGS (global, apenas Super Master edita)
-- ----------------------------------------------------------------------------
create table platform_settings (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null default 'F P Soluções em Altura Ltda.',
  product_name text not null default 'FP Vault360°',
  version text not null default '1.0',
  status text not null default 'Ativo',
  base_date text not null default 'Setembro/2026',
  updated_at timestamptz not null default now(),
  updated_by uuid
);
insert into platform_settings (company_name, product_name) values
  ('F P Soluções em Altura Ltda.', 'FP Vault360°');

create table version_history (
  id uuid primary key default uuid_generate_v4(),
  version text not null,
  released_at timestamptz not null default now(),
  released_by uuid,
  source_system text, -- qual sistema associado disparou o bump
  notes text
);

-- ----------------------------------------------------------------------------
-- USERS (espelha auth.users do Supabase Auth)
-- ----------------------------------------------------------------------------
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references tenants(id), -- NULL para Super Master
  is_super_master boolean not null default false,
  full_name text not null,
  email text not null,
  phone text,
  job_title text,
  unit text,
  avatar_url text,
  active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);
-- Apenas 1 Super Master ativo no sistema
create unique index uq_users_super_master on users (is_super_master) where is_super_master = true and deleted_at is null;
create index idx_users_tenant on users(tenant_id) where deleted_at is null;

-- Consistência: Super Master nunca tem tenant_id
alter table users add constraint chk_super_master_no_tenant
  check (not (is_super_master = true and tenant_id is not null));

-- ----------------------------------------------------------------------------
-- RBAC — ROLES, PERMISSIONS, GRANULAR ASSIGNMENT
-- ----------------------------------------------------------------------------
create table roles (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id), -- NULL = papel global do sistema (níveis 0-5 padrão)
  code text not null, -- 'super_master','fp_admin','client_manager','inspector','warehouse','operational'
  name text not null,
  level int not null, -- 0..5, menor = mais privilégios
  is_system boolean not null default true, -- roles padrão não podem ser excluídos
  created_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table permissions (
  id uuid primary key default uuid_generate_v4(),
  module text not null, -- 'equipment','inspections','kits','training','audit','bi','imports','contracts','platform'
  action text not null, -- 'view','create','update','delete','approve','export'
  code text generated always as (module || ':' || action) stored unique
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table user_roles (
  user_id uuid not null references users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  tenant_id uuid references tenants(id),
  assigned_at timestamptz not null default now(),
  assigned_by uuid,
  primary key (user_id, role_id)
);

-- Seed dos papéis padrão (globais, replicados por tenant no provisionamento)
insert into roles (tenant_id, code, name, level, is_system) values
  (null, 'super_master',    'Super Master',              0, true),
  (null, 'fp_admin',        'Administrador Global FP',   1, true),
  (null, 'client_manager',  'Gestor de Cliente',         2, true),
  (null, 'inspector',       'Inspetor',                  3, true),
  (null, 'warehouse',       'Almoxarife',                4, true),
  (null, 'operational',     'Usuário Operacional',       5, true);

-- ----------------------------------------------------------------------------
-- AUDIT LOG (imutável — sem UPDATE/DELETE)
-- ----------------------------------------------------------------------------
create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid,
  user_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  ip_address inet,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_log_tenant on audit_log(tenant_id, created_at desc);
create index idx_audit_log_user on audit_log(user_id, created_at desc);

create or replace function fn_audit_log_immutable()
returns trigger as $$
begin
  raise exception 'audit_log é imutável: UPDATE/DELETE não permitidos';
end;
$$ language plpgsql;

create trigger trg_audit_log_no_update before update on audit_log
  for each row execute function fn_audit_log_immutable();
create trigger trg_audit_log_no_delete before delete on audit_log
  for each row execute function fn_audit_log_immutable();

-- ----------------------------------------------------------------------------
-- updated_at automático (aplicado a todas as tabelas de negócio)
-- ----------------------------------------------------------------------------
create or replace function fn_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_tenants_updated_at before update on tenants
  for each row execute function fn_set_updated_at();
create trigger trg_users_updated_at before update on users
  for each row execute function fn_set_updated_at();
