import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { canDeleteRecords } from '@/shared/lib/supabase/authorization'
import { DeleteRecordButton } from '@/shared/components/DeleteRecordButton'

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default async function ManufacturerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: manufacturer, error } = await supabase
    .from('manufacturers')
    .select('*, equipment(id, model, serial_number, status)')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !manufacturer) {
    notFound()
  }

  const { data: audit } = await supabase
    .from('audit_log')
    .select('id, action, created_at, metadata, user:users(full_name)')
    .eq('entity', 'manufacturers')
    .eq('entity_id', params.id)
    .order('created_at', { ascending: false })

  const canDelete = await canDeleteRecords(supabase)

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-brand-700/70">Fabricante</p>
          <h1 className="mt-2 text-2xl font-semibold text-brand-900">{manufacturer.name}</h1>
          <p className="mt-1 text-sm text-brand-900/70">{manufacturer.website ?? 'Site não informado'}</p>
        </div>

        {canDelete && <DeleteRecordButton endpoint={`/api/fabricantes/${params.id}`} redirectUrl="/fabricantes" />}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-900">Informações principais</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoBlock label="Site" value={manufacturer.website ?? '—'} />
            <InfoBlock label="Status" value={manufacturer.status === 'active' ? 'Ativo' : 'Inativo'} />
            <InfoBlock label="País" value={manufacturer.country ?? '—'} />
            <InfoBlock label="Última atualização" value={formatDateTime(manufacturer.updated_at)} />
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-700/70">Notas</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-brand-900/80">{manufacturer.notes ?? 'Nenhuma nota registrada.'}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-900">Relações</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-lg bg-brand-50 p-3"><p className="text-brand-700/70">Equipamentos vinculados</p><p className="mt-1 text-brand-900">{manufacturer.equipment?.length ?? 0} registro(s)</p></div>
            <div className="rounded-lg bg-brand-50 p-3"><p className="text-brand-700/70">Eventos de auditoria</p><p className="mt-1 text-brand-900">{audit?.length ?? 0} evento(s)</p></div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-900">Auditoria</h2>
        <div className="mt-4 space-y-3">
          {(audit ?? []).length ? (
            (audit ?? []).map((item: any) => (
              <div key={item.id} className="rounded-lg border border-brand-100 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-brand-900">{item.action}</span>
                  <span className="text-brand-700/60">{formatDateTime(item.created_at)}</span>
                </div>
                <p className="mt-1 text-brand-900/70">Usuário: {item.user?.full_name ?? 'Sistema'}</p>
                <p className="mt-1 whitespace-pre-wrap text-brand-900/70">{JSON.stringify(item.metadata ?? {}, null, 2)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-brand-900/60">Nenhum evento de auditoria para este fabricante.</p>
          )}
        </div>
      </div>
    </section>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-brand-100 bg-brand-50/40 p-3">
      <p className="text-xs uppercase tracking-wide text-brand-700/70">{label}</p>
      <p className="mt-1 text-sm font-medium text-brand-900">{value}</p>
    </div>
  )
}
