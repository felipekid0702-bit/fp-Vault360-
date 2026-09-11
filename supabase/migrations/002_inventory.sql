-- ==========================================================================
-- FP VAULT360 - MIGRATION 002: INVENTARIO, RASTREABILIDADE, DOCUMENTOS
-- ==========================================================================

create table manufacturers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  country text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz
);

create table equipment_categories (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  parent_id uuid references equipment_categories(id),
  name text not null,
  code text,
  default_lifespan_months int,
  checklist_template_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz
);

create table cost_centers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  code text,
  unit text,
  sector text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table locations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table equipment (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  category_id uuid references equipment_categories(id),
  manufacturer_id uuid references manufacturers(id),
  cost_center_id uuid references cost_centers(id),
  location_id uuid references locations(id),
  internal_code text,
  serial_number text,
  model text not null,
  manufacture_date date,
  acquisition_date date,
  first_use_date date,
  lifespan_months int,
  expiration_date date generated always as (
    case
      when acquisition_date is not null and lifespan_months is not null
      then (acquisition_date + (lifespan_months * interval '1 month'))::date
      else null
    end
  ) stored,
  invoice_number text,
  certification text,
  ca_number text,
  en_standard text,
  ansi_standard text,
  nfpa_standard text,
  status equipment_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz
);

create index idx_equipment_tenant on equipment(tenant_id) where deleted_at is null;
create index idx_equipment_serial on equipment(tenant_id, serial_number);
create index idx_equipment_status on equipment(tenant_id, status);
create index idx_equipment_expiration on equipment(tenant_id, expiration_date);
create unique index uq_equipment_serial_tenant on equipment(tenant_id, serial_number)
  where deleted_at is null and serial_number is not null;

create table equipment_codes (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  equipment_id uuid not null references equipment(id) on delete cascade,
  code_type text not null check (code_type in ('qr','datamatrix','nfc','barcode')),
  code_value text not null,
  created_at timestamptz not null default now()
);
create unique index uq_equipment_codes on equipment_codes(tenant_id, code_type, code_value);

create table equipment_photos (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  equipment_id uuid not null references equipment(id) on delete cascade,
  storage_path text not null,
  caption text,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  entity text not null,
  entity_id uuid,
  doc_type text not null,
  title text not null,
  storage_path text not null,
  current_version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);

create table document_versions (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  version int not null,
  storage_path text not null,
  uploaded_by uuid,
  uploaded_at timestamptz not null default now(),
  unique (document_id, version)
);

create trigger trg_equipment_updated_at before update on equipment
  for each row execute function fn_set_updated_at();