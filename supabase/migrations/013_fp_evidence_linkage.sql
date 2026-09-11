-- FP VAULT360 - MIGRATION 013: EVIDENCIA POR ITEM E LAUDO ARMAZENADO

alter table inspection_evidences
  add column if not exists checklist_item_id uuid references checklist_items(id);

alter table inspection_reports
  add column if not exists document_hash text;

create or replace function fn_record_equipment_status_movement()
returns trigger as $$
declare
  movement text;
begin
  movement := case
    when new.status = 'quarantine' then 'quarantine'
    when new.status = 'retired' then 'disposal'
    when old.status = 'quarantine' and new.status = 'active' then 'inspection_release'
    when new.status = 'active' then 'stock'
    else 'maintenance'
  end;
  insert into equipment_movements (
    tenant_id, equipment_id, movement_type, from_location_id, to_location_id,
    responsible_user_id, notes, created_by
  ) values (
    new.tenant_id, new.id, movement, old.location_id, new.location_id,
    new.updated_by, format('Status alterado de %s para %s', old.status, new.status),
    new.updated_by
  );
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_record_equipment_status_movement on equipment;
create trigger trg_record_equipment_status_movement
after update of status on equipment
for each row when (old.status is distinct from new.status)
execute function fn_record_equipment_status_movement();
