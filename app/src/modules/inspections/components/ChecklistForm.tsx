'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ChecklistItemStatus, InspectionClassification, InspectionType } from '@/modules/inspections/types'

interface ChecklistItemUI {
  id: string
  label: string
  description: string | null
  is_critical: boolean
  section?: string | null
  evidence_required?: boolean
}

interface Props {
  equipmentId: string
  templateId: string
  templateName: string
  inspectionType: InspectionType
  objective?: string | null
  items: ChecklistItemUI[]
}

export function ChecklistForm({ equipmentId, templateId, templateName, inspectionType, objective, items }: Props) {
  const router = useRouter()
  const [results, setResults] = useState<Record<string, ChecklistItemStatus>>({})
  const [observations, setObservations] = useState<Record<string, string>>({})
  const [classifications, setClassifications] = useState<Record<string, InspectionClassification>>({})
  const [actions, setActions] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState('')
  const [historyNotes, setHistoryNotes] = useState('')
  const [location, setLocation] = useState('')
  const [verdict, setVerdict] = useState<'fit' | 'unfit'>('fit')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasRejection = items.some((i) => ['AR', 'R'].includes(classifications[i.id]))
  const hasRestriction = items.some((i) => classifications[i.id] === 'AV')
  const allAnswered = items.every((i) => results[i.id] && classifications[i.id])

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)

    const payload = {
      equipment_id: equipmentId,
      template_id: templateId,
      type: inspectionType,
      notes,
      history_notes: historyNotes,
      inspection_location: location,
      verdict,
      items: items.map((i) => ({
        checklist_item_id: i.id,
        status: results[i.id],
        classification: classifications[i.id],
        observation: observations[i.id],
        action_required: actions[i.id],
      })),
    }

    const res = await fetch('/api/inspections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(typeof body.error === 'string' ? body.error : body.error?.formErrors?.join(', ') ?? 'Erro ao salvar a inspeção.')
      setSubmitting(false)
      return
    }

    router.push('/inspecoes')
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-medium">{templateName}</h2>
      {objective && <p className="mt-1 text-sm text-brand-900/70">{objective}</p>}

      <div className="mt-4 grid gap-3 rounded-lg border border-brand-100 bg-brand-50 p-4 md:grid-cols-2">
        <label className="text-sm font-medium">Local da inspeção
          <input required value={location} onChange={(event) => setLocation(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 bg-white px-3 py-2 font-normal" />
        </label>
        <label className="text-sm font-medium">Veredito
          <select value={verdict} onChange={(event) => setVerdict(event.target.value as 'fit' | 'unfit')} className="mt-1 block w-full rounded-md border border-brand-100 bg-white px-3 py-2 font-normal">
            <option value="fit">APTO para continuar em serviço</option>
            <option value="unfit">INAPTO para continuar em serviço</option>
          </select>
        </label>
        <label className="text-sm font-medium md:col-span-2">Histórico informado pelo usuário
          <textarea value={historyNotes} onChange={(event) => setHistoryNotes(event.target.value)} placeholder="Queda, contato químico/abrasivo, temperatura extrema ou modificações externas" className="mt-1 block w-full rounded-md border border-brand-100 bg-white px-3 py-2 font-normal" rows={2} />
        </label>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-brand-100 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-700/60">{item.section ?? 'Verificação'}</p>
                <p className="mt-1 text-sm font-medium">
                  {item.label} {item.is_critical && <span className="text-red-600">*crítico</span>}
                </p>
                {item.description && <p className="text-xs text-brand-700/60">{item.description}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-1">
                {(['C', 'B', 'AV', 'AR', 'R'] as InspectionClassification[]).map((classification) => (
                  <button
                    key={classification}
                    type="button"
                    onClick={() => {
                      setClassifications((current) => ({ ...current, [item.id]: classification }))
                      setResults((current) => ({ ...current, [item.id]: ['AR', 'R'].includes(classification) ? 'nok' : classification === 'C' ? 'na' : 'ok' }))
                    }}
                    className={`rounded-md px-3 py-1 text-xs font-medium uppercase ${
                      classifications[item.id] === classification
                        ? classification === 'B'
                          ? 'bg-green-600 text-white'
                          : classification === 'R'
                          ? 'bg-red-600 text-white'
                          : classification === 'AR'
                          ? 'bg-orange-500 text-white'
                          : classification === 'AV'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-500 text-white'
                        : 'bg-brand-50 text-brand-700'
                    }`}
                  >
                    {classification}
                  </button>
                ))}
              </div>
            </div>
            {classifications[item.id] && (
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Observação do achado"
                  value={observations[item.id] ?? ''}
                  onChange={(e) => setObservations((o) => ({ ...o, [item.id]: e.target.value }))}
                  className="w-full rounded-md border border-brand-100 px-3 py-1.5 text-xs outline-none focus:border-brand-500"
                />
                {['AV', 'AR', 'R'].includes(classifications[item.id]) && (
                  <input
                    type="text"
                    placeholder="Ação/decisão necessária"
                    value={actions[item.id] ?? ''}
                    onChange={(e) => setActions((current) => ({ ...current, [item.id]: e.target.value }))}
                    className="w-full rounded-md border border-brand-100 px-3 py-1.5 text-xs outline-none focus:border-brand-500"
                  />
                )}
              </div>
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

      {hasRejection && (
        <p className="mt-3 text-sm font-medium text-red-600">
          Item AR/R identificado — o equipamento deve ser tratado como INAPTO e encaminhado para quarentena.
        </p>
      )}
      {hasRestriction && !hasRejection && <p className="mt-3 text-sm font-medium text-yellow-700">Há itens AV — registre a restrição e a ação de acompanhamento.</p>}
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
