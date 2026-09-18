'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { dateBRToISO, isoToDateBR } from '@/shared/lib/dates'

type EditItem = { id: string; checklist_item_id: string; label?: string; section?: string | null; status: 'ok' | 'nok' | 'na'; classification: 'C' | 'B' | 'AV' | 'AR' | 'R' | null; observation?: string | null; action_required?: string | null }

export function InspectionEditForm({ inspection }: { inspection: { id: string; notes?: string | null; inspection_location?: string | null; next_due_date?: string | null; result?: string | null; verdict?: string | null; items?: EditItem[] } }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(inspection.notes ?? '')
  const [location, setLocation] = useState(inspection.inspection_location ?? '')
  const [nextDueDate, setNextDueDate] = useState(isoToDateBR(inspection.next_due_date))
  const [result, setResult] = useState(inspection.result ?? 'approved')
  const [verdict, setVerdict] = useState(inspection.verdict ?? 'fit')
  const [items, setItems] = useState<EditItem[]>(inspection.items ?? [])
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  function updateItem(id: string, field: keyof EditItem, value: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } as EditItem : item))
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    const payload: Record<string, unknown> = { notes, inspection_location: location, next_due_date: dateBRToISO(nextDueDate), items: items.map(({ label, section, ...item }) => item) }
    if (result !== (inspection.result ?? 'approved')) payload.result = result
    if (verdict !== (inspection.verdict ?? 'fit')) payload.verdict = verdict
    const response = await fetch(`/api/inspections/${inspection.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    const body = await response.json()
    setSaving(false)
    if (!response.ok) { setMessage(body.error?.formErrors?.join(', ') ?? body.error ?? 'Não foi possível salvar a alteração.'); return }
    setMessage(body.approvalRequired ? 'Alteração enviada para aprovação. Os dados permanecem inalterados até a decisão.' : 'Inspeção atualizada com auditoria.')
    setOpen(false)
    router.refresh()
  }

  return <div>
    <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white">{open ? 'Fechar edição' : 'Editar'}</button>
    {open && <form onSubmit={submit} className="mt-4 space-y-4 rounded-lg border border-brand-100 bg-brand-50 p-4">
      <div className="grid gap-3 md:grid-cols-2">
      <label className="text-sm font-medium">Local<input required value={location} onChange={(event) => setLocation(event.target.value)} className="mt-1 block w-full rounded border bg-white px-3 py-2 font-normal" /></label>
      <label className="text-sm font-medium">Próximo vencimento (dd/mm/aaaa)<input required pattern="\\d{2}/\\d{2}/\\d{4}" value={nextDueDate} onChange={(event) => setNextDueDate(event.target.value)} placeholder="31/12/2026" className="mt-1 block w-full rounded border bg-white px-3 py-2 font-normal" /></label>
      <label className="text-sm font-medium">Resultado<select value={result} onChange={(event) => setResult(event.target.value)} className="mt-1 block w-full rounded border bg-white px-3 py-2 font-normal"><option value="approved">Aprovado</option><option value="approved_with_restriction">Aprovado com restrição</option><option value="rejected">Reprovado</option></select></label>
      <label className="text-sm font-medium">Veredito<select value={verdict} onChange={(event) => setVerdict(event.target.value)} className="mt-1 block w-full rounded border bg-white px-3 py-2 font-normal"><option value="fit">Apto</option><option value="unfit">Inapto</option></select></label>
      </div>
      <label className="block text-sm font-medium">Observações<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 block w-full rounded border bg-white px-3 py-2 font-normal" rows={3} /></label>
      <div className="space-y-3"><h3 className="text-sm font-semibold text-brand-900">Itens da inspeção</h3>{items.map((item) => <div key={item.id} className="rounded border border-brand-200 bg-white p-3"><p className="text-sm font-medium">{item.section ? `${item.section} - ` : ''}{item.label ?? 'Item'}</p><div className="mt-2 grid gap-2 md:grid-cols-3"><select value={item.classification ?? ''} onChange={(event) => updateItem(item.id, 'classification', event.target.value)} className="rounded border px-2 py-2 text-sm"><option value="">Classificação</option>{['C', 'B', 'AV', 'AR', 'R'].map((value) => <option key={value} value={value}>{value}</option>)}</select><select value={item.status} onChange={(event) => updateItem(item.id, 'status', event.target.value)} className="rounded border px-2 py-2 text-sm"><option value="ok">OK</option><option value="nok">NOK</option><option value="na">N/A</option></select><input value={item.observation ?? ''} onChange={(event) => updateItem(item.id, 'observation', event.target.value)} placeholder="Observação" className="rounded border px-2 py-2 text-sm" /><input value={item.action_required ?? ''} onChange={(event) => updateItem(item.id, 'action_required', event.target.value)} placeholder="Ação necessária" className="rounded border px-2 py-2 text-sm md:col-span-3" /></div></div>)}</div>
      {message && <p className="text-sm text-brand-700">{message}</p>}
      <button disabled={saving} className="rounded-md bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar alteração'}</button>
    </form>}
  </div>
}