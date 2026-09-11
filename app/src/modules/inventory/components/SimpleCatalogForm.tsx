'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export function SimpleCatalogForm({ endpoint, title, hasLifespan = false }: { endpoint: string; title: string; hasLifespan?: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [country, setCountry] = useState('')
  const [lifespan, setLifespan] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const body = hasLifespan
      ? { name, code: code || undefined, default_lifespan_months: lifespan ? Number(lifespan) : undefined }
      : { name, country: country || undefined }
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message ?? result.error ?? 'Não foi possível salvar.')
      setName(''); setCode(''); setCountry(''); setLifespan(''); setOpen(false); router.refresh()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Não foi possível salvar.')
    } finally { setSaving(false) }
  }

  return <>
    <button onClick={() => setOpen((value) => !value)} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">{open ? 'Fechar' : `+ Novo ${title}`}</button>
    {open && <form onSubmit={submit} className="mt-6 rounded-lg border border-brand-100 bg-white p-5"><div className="grid gap-4 md:grid-cols-3">
      <label className="text-sm font-medium">Nome<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>
      {hasLifespan ? <><label className="text-sm font-medium">Código<input value={code} onChange={(event) => setCode(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label><label className="text-sm font-medium">Vida útil (meses)<input type="number" min="1" value={lifespan} onChange={(event) => setLifespan(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label></> : <label className="text-sm font-medium">País<input value={country} onChange={(event) => setCountry(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>}
    </div>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<div className="mt-4 flex justify-end"><button disabled={saving} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button></div></form>}
  </>
}