-- Execute após criar os buckets no Supabase Storage.
-- Os caminhos devem começar pelo tenant_id para manter isolamento.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false), ('equipment-photos', 'equipment-photos', false)
on conflict (id) do nothing;

create policy "tenant documents read"
on storage.objects for select
using (
  bucket_id in ('documents', 'equipment-photos')
  and (public.fn_is_super_master() or (storage.foldername(name))[1] = (select tenant_id::text from public.users where id = auth.uid()))
);

create policy "tenant documents upload"
on storage.objects for insert
with check (
  bucket_id in ('documents', 'equipment-photos')
  and (public.fn_is_super_master() or (storage.foldername(name))[1] = (select tenant_id::text from public.users where id = auth.uid()))
);
