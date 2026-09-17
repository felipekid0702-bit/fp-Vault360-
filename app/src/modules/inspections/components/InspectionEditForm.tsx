'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function InspectionEditForm({ inspection }: { inspection: { id: string; notes?: string | null; inspection_location?: string | null; next_due_date?: string | null; result?: string | null; verdict?: string | null } }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(inspection.notes ?? '')
  const [location, setLocation] = useState(inspection.inspection_location ?? '')
  const [nextDueDate, setNextDueDate] = useState(inspection.next_due_date ?? '')
  const [result, setResult] = useState(inspection.result ?? 'approved')
  const [verdict, setVerdict] = useState(inspection.verdict ?? 'fit')
  const [message, setMessage] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const response = await fetch(`/api/inspections/${inspection.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ notes, inspection_location: location, next_due_date: nextDueDate, result, verdict }) })
    const body = await response.json()
    if (!response.ok) { setMessage(body.error ?? 'Não foi possível salvar a alteração.'); return }
    setMessage(body.approvalRequired ? 'Alteração de status enviada para aprovação.' : 'Inspeção atualizada.')
    setOpen(false)
    router.refresh()
  }

  return <div>
    <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white">{open ? 'Fechar edição' : 'Editar'}</button>
    {open && <form onSubmit={submit} className="mt-4 grid gap-3 rounded-lg border border-brand-100 bg-brand-50 p-4 md:grid-cols-2">
      <label className="text-sm font-medium">Local<input required value={location} onChange={(event) => setLocation(event.target.value)} className="mt-1 block w-full rounded border bg-white px-3 py-2 font-normal" /></label>
      <label className="text-sm font-medium">Próximo vencimento<input required type="date" value={nextDueDate} onChange={(event) => setNextDueDate(event.target.value)} className="mt-1 block w-full rounded border bg-white px-3 py-2 font-normal" /></label>
      <label className="text-sm font-medium">Resultado<select value={result} onChange={(event) => setResult(event.target.value)} className="mt-1 block w-full rounded border bg-white px-3 py-2 font-normal"><option value="approved">Aprovado</option><option value="approved_with_restriction">Aprovado com restrição</option><option value="rejected">Reprovado</option></select></label>
      <label className="text-sm font-medium">Veredito<select value={verdict} onChange={(event) => setVerdict(event.target.value)} className="mt-1 block w-full rounded border bg-white px-3 py-2 font-normal"><option value="fit">Apto</option><option value="unfit">Inapto</option></select></label>
      <label className="text-sm font-medium md:col-span-2">Observações<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 block w-full rounded border bg-white px-3 py-2 font-normal" rows={3} /></label>
      {message && <p className="text-sm text-brand-700 md:col-span-2">{message}</p>}
      <button className="rounded-md bg-brand-600 px-4 py-2 text-sm text-white md:col-span-2">Salvar alteração</button>
    </form>}
  </div>
}