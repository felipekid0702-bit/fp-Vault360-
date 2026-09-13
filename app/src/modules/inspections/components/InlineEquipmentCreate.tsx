'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export function InlineEquipmentCreate({
  templateId,
  categories,
}: {
  templateId?: string
  categories: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [model, setModel] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
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
        body: JSON.stringify({ category_id: categoryId, model, serial_number: serialNumber || undefined }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message ?? result.error ?? 'Não foi possível cadastrar o equipamento.')

      const destination = templateId
        ? `/inspecoes/nova?equipmentId=${result.data.id}&templateId=${templateId}`
        : `/inspecoes/nova?equipmentId=${result.data.id}`

      router.push(destination)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Não foi possível cadastrar o equipamento.')
      setSaving(false)
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-brand-100 bg-brand-50 p-4">
      <p className="text-sm text-brand-900/70">Caso o equipamento não esteja cadastrado, clique aqui para cadastrar.</p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="mt-3 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white">
          Cadastrar Equipamento
        </button>
      ) : (
        <form onSubmit={submit} className="mt-4 grid gap-2 rounded-md border border-brand-100 bg-white p-3 md:grid-cols-4">
          <select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="rounded-md border border-brand-100 bg-white px-2 py-1 text-xs">
            <option value="">Categoria</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <input required value={model} onChange={(event) => setModel(event.target.value)} placeholder="Modelo" className="rounded-md border border-brand-100 px-2 py-1 text-xs" />
          <input value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} placeholder="Nº Série / Lote" className="rounded-md border border-brand-100 px-2 py-1 text-xs" />
          <div className="flex items-center gap-2">
            <button disabled={saving} className="flex-1 rounded-md bg-brand-600 px-2 py-1 text-xs text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-brand-200 px-2 py-1 text-xs text-brand-700">
              Fechar
            </button>
          </div>
          {error && <p role="alert" className="text-xs text-red-700 md:col-span-4">{error}</p>}
        </form>
      )}
    </div>
  )
}
