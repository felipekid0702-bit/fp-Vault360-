CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Módulo 10 (Alertas Inteligentes): varre vencimentos e gera notificações "broadcast"
-- por tenant (user_id null = visível para todos os usuários daquele tenant no front-end).
-- Evita duplicar no mesmo dia checando se já existe notificação igual criada hoje.
CREATE OR REPLACE FUNCTION public.fn_generate_expiration_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
declare
  r record;
begin
  -- Equipamentos vencidos
  for r in
    select e.tenant_id, count(*) as total
    from equipment e
    where e.deleted_at is null
      and e.expiration_date is not null
      and e.expiration_date < current_date
    group by e.tenant_id
  loop
    if exists (select 1 from notification_rules nr where nr.tenant_id = r.tenant_id and nr.event = 'equipment_expired' and nr.active)
       and not exists (
         select 1 from notifications n
         where n.tenant_id = r.tenant_id and n.title = 'Equipamentos vencidos'
           and n.created_at::date = current_date
       )
    then
      insert into notifications (tenant_id, user_id, channel, title, body)
      select r.tenant_id, null, unnest(nr.channels), 'Equipamentos vencidos',
             format('%s equipamento(s) com validade expirada. Verifique o inventário.', r.total)
      from notification_rules nr
      where nr.tenant_id = r.tenant_id and nr.event = 'equipment_expired' and nr.active;
    end if;
  end loop;

  -- Equipamentos próximos do vencimento (usa days_before de cada regra)
  for r in
    select nr.tenant_id, nr.days_before, nr.channels,
           (select count(*) from equipment e
            where e.tenant_id = nr.tenant_id and e.deleted_at is null
              and e.expiration_date is not null
              and e.expiration_date between current_date and current_date + (nr.days_before || ' days')::interval) as total
    from notification_rules nr
    where nr.event = 'equipment_expiring' and nr.active
  loop
    if r.total > 0 and not exists (
      select 1 from notifications n
      where n.tenant_id = r.tenant_id and n.title = 'Equipamentos próximos do vencimento'
        and n.created_at::date = current_date
    ) then
      insert into notifications (tenant_id, user_id, channel, title, body)
      select r.tenant_id, null, unnest(r.channels), 'Equipamentos próximos do vencimento',
             format('%s equipamento(s) vencem nos próximos %s dias.', r.total, r.days_before);
    end if;
  end loop;

  -- Treinamentos/certificações vencidos
  for r in
    select uc.tenant_id, count(distinct uc.user_id) as total
    from user_certifications uc
    where uc.status = 'expired'
    group by uc.tenant_id
  loop
    if exists (select 1 from notification_rules nr where nr.tenant_id = r.tenant_id and nr.event = 'training_expired' and nr.active)
       and not exists (
         select 1 from notifications n
         where n.tenant_id = r.tenant_id and n.title = 'Treinamentos vencidos'
           and n.created_at::date = current_date
       )
    then
      insert into notifications (tenant_id, user_id, channel, title, body)
      select r.tenant_id, null, unnest(nr.channels), 'Treinamentos vencidos',
             format('%s colaborador(es) com treinamento/certificação vencida.', r.total)
      from notification_rules nr
      where nr.tenant_id = r.tenant_id and nr.event = 'training_expired' and nr.active;
    end if;
  end loop;

  -- Treinamentos/certificações próximos do vencimento
  for r in
    select nr.tenant_id, nr.days_before, nr.channels,
           (select count(distinct uc.user_id) from user_certifications uc
            where uc.tenant_id = nr.tenant_id
              and uc.expires_at is not null
              and uc.expires_at between current_date and current_date + (nr.days_before || ' days')::interval) as total
    from notification_rules nr
    where nr.event = 'training_expiring' and nr.active
  loop
    if r.total > 0 and not exists (
      select 1 from notifications n
      where n.tenant_id = r.tenant_id and n.title = 'Treinamentos próximos do vencimento'
        and n.created_at::date = current_date
    ) then
      insert into notifications (tenant_id, user_id, channel, title, body)
      select r.tenant_id, null, unnest(r.channels), 'Treinamentos próximos do vencimento',
             format('%s colaborador(es) com treinamento/certificação vencendo nos próximos %s dias.', r.total, r.days_before);
    end if;
  end loop;
end;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_generate_expiration_notifications() FROM anon, authenticated;

-- Roda todo dia às 06:00 (horário do banco, UTC por padrão no Supabase)
SELECT cron.schedule(
  'fp_vault360_expiration_notifications',
  '0 6 * * *',
  $$SELECT public.fn_generate_expiration_notifications();$$
);
;
