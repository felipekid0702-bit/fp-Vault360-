'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export function ClientForm({ client }: { client?: Record<string, string | null> }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState({ name: client?.name ?? '', legal_name: client?.legal_name ?? '', cnpj: client?.cnpj ?? '', email: client?.email ?? '', phone: client?.phone ?? '', primary_contact: client?.primary_contact ?? '', notes: client?.notes ?? '', status: client?.status ?? 'active' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const update = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await fetch(client ? `/api/clientes/${client.id}` : '/api/clientes', { method: client ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(values) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message ?? result.error ?? 'Não foi possível salvar o cliente.')
      setOpen(false)
      router.refresh()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Não foi possível salvar o cliente.')
    } finally {
      setSaving(false)
    }
  }

  return <><button type="button" onClick={() => setOpen((value) => !value)} className="text-brand-700 underline">{open ? 'Fechar' : client ? 'Editar' : '+ Novo cliente'}</button>{open && <form onSubmit={submit} className="mt-3 rounded-lg border border-brand-100 bg-white p-4"><div className="grid gap-3 md:grid-cols-3">{[['name', 'Nome'], ['legal_name', 'Razão Social'], ['cnpj', 'CNPJ'], ['email', 'Email'], ['phone', 'Telefone'], ['primary_contact', 'Contato Principal']].map(([key, label]) => <label key={key} className="text-sm font-medium">{label}<input required={key === 'name'} type={key === 'email' ? 'email' : 'text'} value={values[key as keyof typeof values]} onChange={(event) => update(key, event.target.value)} className="mt-1 block w-full rounded border px-2 py-1 font-normal" /></label>)}<label className="text-sm font-medium">Status<select value={values.status} onChange={(event) => update('status', event.target.value)} className="mt-1 block w-full rounded border px-2 py-1 font-normal"><option value="active">Ativo</option><option value="inactive">Inativo</option></select></label><label className="text-sm font-medium md:col-span-3">Observações<textarea value={values.notes} onChange={(event) => update('notes', event.target.value)} className="mt-1 block w-full rounded border px-2 py-1 font-normal" /></label></div>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}<button disabled={saving} className="mt-3 rounded bg-brand-600 px-3 py-1 text-sm text-white">{saving ? 'Salvando...' : 'Salvar'}</button></form>}</>
}
