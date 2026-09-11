'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

const statuses = [['received', 'Recebido'], ['in_inspection', 'Em Inspeção'], ['in_maintenance', 'Em Manutenção'], ['completed', 'Concluído'], ['delivered', 'Entregue'], ['cancelled', 'Cancelado']]

export function ServiceForm({ clients, service }: { clients: Array<{ id: string; name: string }>; service?: Record<string, any> }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [clientId, setClientId] = useState(service?.client_id ?? service?.client?.id ?? '')
  const [workOrder, setWorkOrder] = useState(service?.work_order ?? '')
  const [status, setStatus] = useState(service?.status ?? 'received')
  const [notes, setNotes] = useState(service?.notes ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      const response = await fetch(service ? `/api/servicos/${service.id}` : '/api/servicos', { method: service ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ client_id: clientId, work_order: workOrder, status, notes }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message ?? result.error ?? 'Não foi possível salvar o serviço.')
      setOpen(false); router.refresh()
    } catch (submissionError) { setError(submissionError instanceof Error ? submissionError.message : 'Não foi possível salvar o serviço.') }
    finally { setSaving(false) }
  }

  return <><button type="button" onClick={() => setOpen((value) => !value)} className={service ? 'text-brand-700 underline' : 'rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white'}>{open ? 'Fechar' : service ? 'Editar' : '+ Novo serviço'}</button>{open && <form onSubmit={submit} className="mt-4 rounded-lg border border-brand-100 bg-white p-4"><div className="grid gap-3 md:grid-cols-3"><label className="text-sm font-medium">OS<input required value={workOrder} onChange={(event) => setWorkOrder(event.target.value)} className="mt-1 block w-full rounded border px-2 py-1 font-normal" /></label><label className="text-sm font-medium">Cliente<select required value={clientId} onChange={(event) => setClientId(event.target.value)} className="mt-1 block w-full rounded border px-2 py-1 font-normal"><option value="">Selecione</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label><label className="text-sm font-medium">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 block w-full rounded border px-2 py-1 font-normal">{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-medium md:col-span-3">Observações<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 block w-full rounded border px-2 py-1 font-normal" /></label></div>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}<button disabled={saving} className="mt-3 rounded bg-brand-600 px-3 py-1 text-sm text-white">{saving ? 'Salvando...' : 'Salvar'}</button></form>}</>
}
