'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export function EquipmentForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [model, setModel] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [internalCode, setInternalCode] = useState('')
  const [acquisitionDate, setAcquisitionDate] = useState('')
  const [lifespan, setLifespan] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          serial_number: serialNumber || undefined,
          internal_code: internalCode || undefined,
          acquisition_date: acquisitionDate || undefined,
          lifespan_months: lifespan ? Number(lifespan) : undefined,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message ?? result.error ?? 'Não foi possível cadastrar o equipamento.')
      setModel(''); setSerialNumber(''); setInternalCode(''); setAcquisitionDate(''); setLifespan(''); setOpen(false); router.refresh()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Não foi possível cadastrar o equipamento.')
    } finally { setSaving(false) }
  }

  return <>
    <button onClick={() => setOpen((value) => !value)} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">{open ? 'Fechar' : '+ Novo Equipamento'}</button>
    {open && <form onSubmit={submit} className="mt-6 rounded-lg border border-brand-100 bg-white p-5"><div className="grid gap-4 md:grid-cols-3">
      <label className="text-sm font-medium">Modelo<input required value={model} onChange={(event) => setModel(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>
      <label className="text-sm font-medium">Número de série<input value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>
      <label className="text-sm font-medium">Código interno<input value={internalCode} onChange={(event) => setInternalCode(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>
      <label className="text-sm font-medium">Data de aquisição<input type="date" value={acquisitionDate} onChange={(event) => setAcquisitionDate(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>
      <label className="text-sm font-medium">Vida útil (meses)<input type="number" min="1" value={lifespan} onChange={(event) => setLifespan(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>
    </div>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<div className="mt-4 flex justify-end"><button disabled={saving} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar equipamento'}</button></div></form>}
  </>
}