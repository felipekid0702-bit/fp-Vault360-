import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { canDeleteRecords } from '@/shared/lib/supabase/authorization'
import { DeleteRecordButton } from '@/shared/components/DeleteRecordButton'

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR', { dateStyle: 'short' })
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default async function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: equipment, error } = await supabase
    .from('equipment')
    .select(
      `*,
      manufacturer:manufacturers(name),
      category:equipment_categories(name),
      client:clients(name),
      service:services(id, work_order, status),
      photos:equipment_photos(id, storage_path, caption),
      codes:equipment_codes(code_type, code_value),
      history:inspections(id, type, result, performed_at, next_due_date),
      kit:kit_items(kit_id, kit:kits(name, code))`,
    )
    .eq('id', params.id)
    .maybeSingle()

  if (error || !equipment) {
    notFound()
  }

  const [inspectionsResult, maintenanceResult, quarantineResult, disposalResult, auditResult] = await Promise.all([
    supabase
      .from('inspections')
      .select('id, type, result, verdict, performed_at, next_due_date, inspector:users!inspections_inspector_id_fkey(full_name)')
      .eq('equipment_id', params.id)
      .order('performed_at', { ascending: false }),
    supabase
      .from('maintenance_records')
      .select('id, maintenance_type, status, started_at, completed_at, notes')
      .eq('equipment_id', params.id)
      .order('started_at', { ascending: false }),
    supabase
      .from('quarantine_cases')
      .select('id, reason, status, opened_at, closed_at, notes')
      .eq('equipment_id', params.id)
      .order('opened_at', { ascending: false }),
    supabase
      .from('disposal_records')
      .select('id, reason, disposed_at, notes')
      .eq('equipment_id', params.id)
      .order('disposed_at', { ascending: false }),
    supabase
      .from('audit_log')
      .select('id, action, entity, created_at, metadata, user:users(full_name)')
      .eq('entity', 'equipment')
      .eq('entity_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  const canDelete = await canDeleteRecords(supabase)

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-brand-700/70">Equipamento</p>
          <h1 className="mt-2 text-2xl font-semibold text-brand-900">{equipment.model}</h1>
          <p className="mt-1 text-sm text-brand-900/70">{equipment.serial_number ?? 'Sem número de série'} · {equipment.internal_code ?? 'Sem código interno'}</p>
        </div>

        {canDelete && (
          <DeleteRecordButton endpoint={`/api/equipment/${params.id}`} redirectUrl="/equipamentos" />
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-900">Informações principais</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoBlock label="Categoria" value={equipment.category?.name ?? '—'} />
            <InfoBlock label="Fabricante" value={equipment.manufacturer?.name ?? '—'} />
            <InfoBlock label="Cliente" value={equipment.client?.name ?? '—'} />
            <InfoBlock label="Serviço" value={equipment.service?.work_order ?? '—'} />
            <InfoBlock label="Status" value={equipment.status ?? '—'} />
            <InfoBlock label="Tipo de proprietário" value={equipment.owner_type === 'fp' ? 'FP' : 'Cliente'} />
            <InfoBlock label="Data de aquisição" value={formatDate(equipment.acquisition_date)} />
            <InfoBlock label="Data de primeira utilização" value={formatDate(equipment.first_use_date)} />
            <InfoBlock label="Nota fiscal (NF)" value={equipment.invoice_number ?? '—'} />
            <InfoBlock label="Validade" value={formatDate(equipment.expiration_date)} />
            <InfoBlock label="Lifespan (meses)" value={equipment.lifespan_months?.toString() ?? '—'} />
            <InfoBlock label="Localização" value={equipment.location_id ?? '—'} />
            <InfoBlock label="Criado em" value={formatDateTime(equipment.created_at)} />
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-700/70">Observações</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-brand-900/80">{equipment.notes ?? 'Nenhuma observação registrada.'}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-900">Relacionamentos</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-lg bg-brand-50 p-3">
              <p className="text-brand-700/70">Fotos</p>
              <p className="mt-1 text-brand-900">{equipment.photos?.length ?? 0} registro(s)</p>
            </div>
            <div className="rounded-lg bg-brand-50 p-3">
              <p className="text-brand-700/70">Códigos</p>
              <p className="mt-1 text-brand-900">{equipment.codes?.length ?? 0} código(s)</p>
            </div>
            <div className="rounded-lg bg-brand-50 p-3">
              <p className="text-brand-700/70">Inspeções</p>
              <p className="mt-1 text-brand-900">{inspectionsResult.data?.length ?? 0} inspeção(ões)</p>
            </div>
            <div className="rounded-lg bg-brand-50 p-3">
              <p className="text-brand-700/70">Quarentena</p>
              <p className="mt-1 text-brand-900">{quarantineResult.data?.length ?? 0} caso(s)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailPanel title="Histórico" items={[
          { label: 'Inspeções', value: inspectionsResult.data?.length ? `${inspectionsResult.data.length} registro(s)` : 'Nenhuma inspeção registrada' },
          { label: 'Manutenções', value: maintenanceResult.data?.length ? `${maintenanceResult.data.length} registro(s)` : 'Nenhuma manutenção registrada' },
          { label: 'Quarentenas', value: quarantineResult.data?.length ? `${quarantineResult.data.length} caso(s)` : 'Nenhuma quarentena registrada' },
          { label: 'Descartes', value: disposalResult.data?.length ? `${disposalResult.data.length} registro(s)` : 'Nenhum descarte registrado' },
        ]} />

        <DetailPanel title="Auditoria" items={[
          { label: 'Criado por', value: equipment.created_by ?? '—' },
          { label: 'Atualizado por', value: equipment.updated_by ?? '—' },
          { label: 'Últimos eventos', value: auditResult.data?.length ? `${auditResult.data.length} evento(s)` : 'Sem eventos de auditoria' },
        ]} />
      </div>

      <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-900">Auditoria detalhada</h2>
        <div className="mt-4 space-y-3">
          {(auditResult.data ?? []).length ? (
            (auditResult.data ?? []).map((item: any) => (
              <div key={item.id} className="rounded-lg border border-brand-100 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-brand-900">{item.action}</span>
                  <span className="text-brand-700/60">{formatDateTime(item.created_at)}</span>
                </div>
                <p className="mt-1 text-brand-900/70">Usuário: {item.user?.full_name ?? 'Sistema'} · Entidade: {item.entity}</p>
                <p className="mt-1 whitespace-pre-wrap text-brand-900/70">{JSON.stringify(item.metadata ?? {}, null, 2)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-brand-900/60">Nenhum registro de auditoria encontrado.</p>
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

function DetailPanel({ title, items }: { title: string; items: Array<{ label: string; value: string }> }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-brand-900">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg bg-brand-50 p-3 text-sm">
            <span className="text-brand-900/70">{item.label}</span>
            <strong className="text-right text-brand-900">{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
