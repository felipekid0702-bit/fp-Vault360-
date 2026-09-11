'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ChecklistItemStatus, InspectionType } from '@/modules/inspections/types'

interface ChecklistItemUI {
  id: string
  label: string
  description: string | null
  is_critical: boolean
}

interface Props {
  equipmentId: string
  templateId: string
  templateName: string
  inspectionType: InspectionType
  items: ChecklistItemUI[]
}

export function ChecklistForm({ equipmentId, templateId, templateName, inspectionType, items }: Props) {
  const router = useRouter()
  const [results, setResults] = useState<Record<string, ChecklistItemStatus>>({})
  const [observations, setObservations] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasCriticalFail = items.some((i) => i.is_critical && results[i.id] === 'nok')
  const allAnswered = items.every((i) => results[i.id])

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)

    const payload = {
      equipment_id: equipmentId,
      template_id: templateId,
      type: inspectionType,
      notes,
      items: items.map((i) => ({
        checklist_item_id: i.id,
        status: results[i.id],
        observation: observations[i.id],
      })),
    }

    const res = await fetch('/api/inspections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error?.formErrors?.join(', ') ?? 'Erro ao salvar a inspeção.')
      setSubmitting(false)
      return
    }

    router.push('/inspecoes')
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-medium">{templateName}</h2>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-brand-100 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  {item.label} {item.is_critical && <span className="text-red-600">*crítico</span>}
                </p>
                {item.description && <p className="text-xs text-brand-700/60">{item.description}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                {(['ok', 'nok', 'na'] as ChecklistItemStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setResults((r) => ({ ...r, [item.id]: status }))}
                    className={`rounded-md px-3 py-1 text-xs font-medium uppercase ${
                      results[item.id] === status
                        ? status === 'ok'
                          ? 'bg-green-600 text-white'
                          : status === 'nok'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-400 text-white'
                        : 'bg-brand-50 text-brand-700'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            {results[item.id] === 'nok' && (
              <input
                type="text"
                placeholder="Observação (obrigatório para reprovação)"
                value={observations[item.id] ?? ''}
                onChange={(e) => setObservations((o) => ({ ...o, [item.id]: e.target.value }))}
                className="mt-2 w-full rounded-md border border-brand-100 px-3 py-1.5 text-xs outline-none focus:border-brand-500"
              />
            )}
          </div>
        ))}
      </div>

      <textarea
        placeholder="Observações gerais da inspeção"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="mt-4 w-full rounded-md border border-brand-100 px-3 py-2 text-sm outline-none focus:border-brand-500"
        rows={3}
      />

      {hasCriticalFail && (
        <p className="mt-3 text-sm font-medium text-red-600">
          Item crítico reprovado — esta inspeção será automaticamente marcada como Reprovada.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        className="mt-4 w-full rounded-md bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? 'Salvando...' : 'Concluir Inspeção'}
      </button>
    </div>
  )
}
