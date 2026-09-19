'use client'

import { useState } from 'react'

const options = [
  ['equipment', 'Equipamentos'],
  ['inspections', 'Inspeções'],
  ['kits', 'Kits'],
  ['clients', 'Clientes'],
  ['manufacturers', 'Fabricantes'],
  ['services', 'Serviços'],
] as const

export function BulkDeleteManager() {
  const [entity, setEntity] = useState<(typeof options)[number][0]>('equipment')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setMessage('')
    const response = await fetch('/api/admin/bulk-delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ entity, confirmation }),
    })
    const result = await response.json()
    setMessage(response.ok ? `${result.deleted} registro(s) marcado(s) para exclusão.` : result.error ?? 'Não foi possível excluir.')
    setConfirmation('')
    setBusy(false)
  }

  return <section className="rounded-lg border border-red-200 bg-red-50 p-5">
    <h2 className="font-medium text-red-900">Exclusão em bloco</h2>
    <p className="mt-1 text-sm text-red-900/75">Área exclusiva do SUPERIOR_MASTER. A exclusão é registrada na auditoria.</p>
    <div className="mt-4 flex flex-wrap items-end gap-3">
      <label className="text-sm font-medium text-red-900">Tipo<select value={entity} onChange={(event) => setEntity(event.target.value as typeof entity)} className="mt-1 block rounded border border-red-200 bg-white px-3 py-2 font-normal">{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-sm font-medium text-red-900">Digite EXCLUIR<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1 block rounded border border-red-200 bg-white px-3 py-2 font-normal" /></label>
      <button type="button" disabled={busy || confirmation !== 'EXCLUIR'} onClick={submit} className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? 'Excluindo...' : 'Excluir selecionado'}</button>
    </div>
    {message && <p role="status" className="mt-3 text-sm text-red-900">{message}</p>}
  </section>
}
