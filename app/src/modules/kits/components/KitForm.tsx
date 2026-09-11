'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export function KitForm() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      const response = await fetch('/api/kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code: code || undefined, category: category || undefined }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message ?? result.error ?? 'Não foi possível criar o kit.')
      setName('')
      setCode('')
      setCategory('')
      setIsOpen(false)
      router.refresh()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Não foi possível criar o kit.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen((current) => !current)} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
        {isOpen ? 'Fechar' : '+ Novo Kit'}
      </button>
      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-brand-100 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-medium">Nome<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>
            <label className="text-sm font-medium">Código<input value={code} onChange={(event) => setCode(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>
            <label className="text-sm font-medium">Categoria<input value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
          <div className="mt-4 flex justify-end"><button disabled={isSaving} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{isSaving ? 'Salvando...' : 'Salvar kit'}</button></div>
        </form>
      )}
    </>
  )
}