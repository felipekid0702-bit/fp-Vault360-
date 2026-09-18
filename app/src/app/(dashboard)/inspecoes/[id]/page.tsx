import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { InspectionEditForm } from '@/modules/inspections/components/InspectionEditForm'
import { InspectionChangeDecision } from '@/modules/inspections/components/InspectionChangeDecision'
import { formatDateTimeBR } from '@/shared/lib/dates'

export default async function InspectionDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: inspection, error } = await supabase
    .from('inspections')
    .select(
      `*,
      equipment:equipment(model, serial_number, internal_code, status, client:clients(name), manufacturer:manufacturers(name), category:equipment_categories(name)),
      inspector:users!inspections_inspector_id_fkey(full_name),
      checklist:checklist_templates(name, template_code),
      evidences:inspection_evidences(id, storage_path, caption),
      signatures:inspection_signatures(id, signature_image_path, signed_at),
      items:inspection_items_result(id, status, classification, action_required, observation, checklist_items(label, section))`,
    )
    .eq('id', params.id)
    .maybeSingle()

  if (error || !inspection) {
    notFound()
  }

  const [{ data: audit }, { data: changes }] = await Promise.all([
    supabase
      .from('audit_log')
      .select('id, action, created_at, metadata, user:users(full_name)')
      .eq('entity', 'inspections')
      .eq('entity_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('inspection_change_requests')
      .select('id, requested_by, approved_by, proposed_data, previous_data, status, rejection_reason, created_at, decided_at, requester:users!inspection_change_requests_requested_by_fkey(full_name), approver:users!inspection_change_requests_approved_by_fkey(full_name)')
      .eq('inspection_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
        <p className="text-xs uppercase tracking-[0.22em] text-brand-700/70">Inspeção</p>
        <h1 className="mt-2 text-2xl font-semibold text-brand-900">{inspection.checklist?.name ?? 'Ficha de inspeção'}</h1>
        <p className="mt-1 text-sm text-brand-900/70">{inspection.equipment?.model ?? 'Equipamento'} · {inspection.equipment?.serial_number ?? 'Sem serial'}</p>
          </div>
          <InspectionEditForm inspection={{ ...inspection, items: (inspection.items ?? []).map((item: any) => ({ ...item, label: item.checklist_items?.label, section: item.checklist_items?.section })) }} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-900">Informações principais</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoBlock label="Tipo" value={inspection.type ?? '—'} />
            <InfoBlock label="Resultado" value={inspection.result ?? '—'} />
            <InfoBlock label="Veredito" value={inspection.verdict ?? '—'} />
            <InfoBlock label="Inspetor" value={inspection.inspector?.full_name ?? '—'} />
            <InfoBlock label="Data da inspeção" value={formatDateTimeBR(inspection.performed_at)} />
            <InfoBlock label="Próximo vencimento" value={formatDateTimeBR(inspection.next_due_date)} />
            <InfoBlock label="Local" value={inspection.inspection_location ?? '—'} />
            <InfoBlock label="Status do equipamento" value={inspection.equipment?.status ?? '—'} />
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-700/70">Observações</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-brand-900/80">{inspection.notes ?? 'Nenhuma observação registrada.'}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-900">Relacionamentos</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-lg bg-brand-50 p-3"><p className="text-brand-700/70">Equipamento</p><p className="mt-1 text-brand-900">{inspection.equipment?.model ?? '—'}</p></div>
            <div className="rounded-lg bg-brand-50 p-3"><p className="text-brand-700/70">Cliente</p><p className="mt-1 text-brand-900">{inspection.equipment?.client?.name ?? '—'}</p></div>
            <div className="rounded-lg bg-brand-50 p-3"><p className="text-brand-700/70">Evidências</p><p className="mt-1 text-brand-900">{inspection.evidences?.length ?? 0} anexo(s)</p></div>
            <div className="rounded-lg bg-brand-50 p-3"><p className="text-brand-700/70">Itens avaliados</p><p className="mt-1 text-brand-900">{inspection.items?.length ?? 0}</p></div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-900">Itens da inspeção</h2>
        <div className="mt-4 space-y-3">
          {(inspection.items ?? []).length ? (
            inspection.items.map((item: any) => (
              <div key={item.id} className="rounded-lg border border-brand-100 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-brand-900">{item.checklist_items?.label ?? 'Item sem nome'}</span>
                  <span className="rounded-full bg-brand-50 px-2 py-1 text-xs text-brand-700">{item.classification ?? '—'}</span>
                </div>
                <p className="mt-1 text-brand-900/70">Status: {item.status ?? '—'}</p>
                {item.action_required && <p className="mt-1 text-brand-900/70">Ação: {item.action_required}</p>}
                {item.observation && <p className="mt-1 text-brand-900/70">Observação: {item.observation}</p>}
              </div>
            ))
          ) : (
            <p className="text-sm text-brand-900/60">Nenhum item registrado para esta inspeção.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-900">Histórico de Alterações</h2>
        <div className="mt-4 space-y-3">
          {(changes ?? []).length ? (changes ?? []).map((change: any) => (
            <div key={change.id} className="rounded-lg border border-brand-100 p-3 text-sm">
                <div className="flex items-center justify-between gap-2"><span className="font-medium text-brand-900">{change.status === 'approved' ? 'Aprovada' : change.status === 'rejected' ? 'Rejeitada' : 'Pendente'}</span><span className="text-brand-700/60">{formatDateTimeBR(change.decided_at ?? change.created_at)}</span></div>
              <p className="mt-1 text-brand-900/70">Solicitante: {change.requester?.full_name ?? '—'} · Aprovador: {change.approver?.full_name ?? '—'}</p>
              <p className="mt-1 whitespace-pre-wrap text-brand-900/70">Alteração: {JSON.stringify(change.proposed_data ?? {})}</p>
              {change.rejection_reason && <p className="mt-1 text-red-700">Motivo da rejeição: {change.rejection_reason}</p>}
              {change.status === 'pending' && <InspectionChangeDecision id={change.id} />}
            </div>
          )) : <p className="text-sm text-brand-900/60">Nenhuma solicitação de alteração registrada.</p>}
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
                  <span className="text-brand-700/60">{formatDateTimeBR(item.created_at)}</span>
                </div>
                <p className="mt-1 text-brand-900/70">Usuário: {item.user?.full_name ?? 'Sistema'}</p>
                <p className="mt-1 whitespace-pre-wrap text-brand-900/70">{JSON.stringify(item.metadata ?? {}, null, 2)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-brand-900/60">Nenhum evento de auditoria para esta inspeção.</p>
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
