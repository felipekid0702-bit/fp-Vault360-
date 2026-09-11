'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export function ManufacturerForm({ manufacturer }: { manufacturer?: { id: string; name: string; website?: string | null; notes?: string | null; status?: string } }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(manufacturer?.name ?? '')
  const [website, setWebsite] = useState(manufacturer?.website ?? '')
  const [notes, setNotes] = useState(manufacturer?.notes ?? '')
  const [status, setStatus] = useState(manufacturer?.status ?? 'active')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await fetch(manufacturer ? `/api/fabricantes/${manufacturer.id}` : '/api/fabricantes', {
        method: manufacturer ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, website: website || undefined, notes: notes || undefined, status }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message ?? result.error ?? 'Não foi possível salvar o fabricante.')
      setOpen(false)
      router.refresh()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Não foi possível salvar o fabricante.')
    } finally {
      setSaving(false)
    }
  }

  return <><button type="button" onClick={() => setOpen((value) => !value)} className="text-brand-700 underline">{open ? 'Fechar' : manufacturer ? 'Editar' : '+ Novo fabricante'}</button>{open && <form onSubmit={submit} className="mt-3 rounded-lg border border-brand-100 bg-white p-4"><div className="grid gap-3 md:grid-cols-3"><label className="text-sm font-medium">Nome<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 block w-full rounded border px-2 py-1 font-normal" /></label><label className="text-sm font-medium">Site<input type="url" value={website} onChange={(event) => setWebsite(event.target.value)} className="mt-1 block w-full rounded border px-2 py-1 font-normal" /></label><label className="text-sm font-medium">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 block w-full rounded border px-2 py-1 font-normal"><option value="active">Ativo</option><option value="inactive">Inativo</option></select></label><label className="text-sm font-medium md:col-span-3">Observações<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 block w-full rounded border px-2 py-1 font-normal" /></label></div>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}<button disabled={saving} className="mt-3 rounded bg-brand-600 px-3 py-1 text-sm text-white">{saving ? 'Salvando...' : 'Salvar'}</button></form>}</>
}
