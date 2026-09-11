'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

interface CatalogOption {
  id: string
  name: string
}

interface UserOption {
  id: string
  full_name: string
}

interface Props {
  certifications: CatalogOption[]
  trainings: CatalogOption[]
  users: UserOption[]
}

export function IssueCertificationForm({ certifications, trainings, users }: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState('')
  const [certificationId, setCertificationId] = useState('')
  const [trainingId, setTrainingId] = useState('')
  const [issuedAt, setIssuedAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      const response = await fetch('/api/certificacoes/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          certification_id: certificationId,
          training_id: trainingId || undefined,
          issued_at: issuedAt,
          expires_at: expiresAt || undefined,
          notes: notes || undefined,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message ?? result.error ?? 'Não foi possível emitir a certificação.')
      setUserId('')
      setCertificationId('')
      setTrainingId('')
      setIssuedAt('')
      setExpiresAt('')
      setNotes('')
      setIsOpen(false)
      router.refresh()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Não foi possível emitir a certificação.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen((current) => !current)} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
        {isOpen ? 'Fechar' : '+ Emitir certificação'}
      </button>
      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-brand-100 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-medium">
              Colaborador
              <select required value={userId} onChange={(event) => setUserId(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal">
                <option value="">Selecione…</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.full_name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Certificação
              <select required value={certificationId} onChange={(event) => setCertificationId(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal">
                <option value="">Selecione…</option>
                {certifications.map((certification) => (
                  <option key={certification.id} value={certification.id}>{certification.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Treinamento (opcional)
              <select value={trainingId} onChange={(event) => setTrainingId(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal">
                <option value="">Selecione…</option>
                {trainings.map((training) => (
                  <option key={training.id} value={training.id}>{training.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Data de emissão
              <input required type="date" value={issuedAt} onChange={(event) => setIssuedAt(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" />
            </label>
            <label className="text-sm font-medium">
              Data de validade (opcional)
              <input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" />
              <span className="mt-1 block text-xs font-normal text-brand-700/60">Se a certificação escolhida tiver validade padrão cadastrada, será calculada automaticamente.</span>
            </label>
            <label className="text-sm font-medium">
              Observações
              <input value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" />
            </label>
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
          <div className="mt-4 flex justify-end">
            <button disabled={isSaving} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {isSaving ? 'Salvando...' : 'Emitir certificação'}
            </button>
          </div>
        </form>
      )}
    </>
  )
}
