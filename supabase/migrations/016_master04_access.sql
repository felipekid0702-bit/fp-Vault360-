insert into roles (tenant_id, code, name, level, is_system)
select null, 'master04', 'Master04', 1, true
where not exists (
  select 1 from roles where tenant_id is null and code = 'master04'
);
