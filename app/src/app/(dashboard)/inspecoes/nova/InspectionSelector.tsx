'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Equipment = { id: string; model: string; serial_number?: string | null; category_id?: string | null; category?: { name?: string } | null }
type Template = { id: string; template_code?: string | null; name: string; category_id?: string | null }

export function InspectionSelector({ equipment, templates }: { equipment: Equipment[]; templates: Template[] }) {
  const router = useRouter()
  const [equipmentId, setEquipmentId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const selectedEquipment = equipment.find((item) => item.id === equipmentId)
  const availableTemplates = templates

  return (
    <div className="mt-6 max-w-3xl rounded-lg border border-brand-100 bg-white p-5">
      <h2 className="text-lg font-medium">Escolha o equipamento e a ficha FP</h2>
      <p className="mt-1 text-sm text-brand-900/70">Selecione o equipamento para carregar o checklist compatível e iniciar a inspeção.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">Tipo / equipamento
          <select value={equipmentId} onChange={(event) => { setEquipmentId(event.target.value); setTemplateId('') }} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal">
            <option value="">Selecione o equipamento</option>
            {equipment.map((item) => <option key={item.id} value={item.id}>{item.category?.name ?? 'Sem categoria'} · {item.model}{item.serial_number ? ` · ${item.serial_number}` : ''}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Ficha / tipo de inspeção
          <select value={templateId} onChange={(event) => setTemplateId(event.target.value)} disabled={!equipmentId} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal disabled:bg-brand-50">
            <option value="">Selecione a ficha</option>
            {availableTemplates.map((template) => <option key={template.id} value={template.id}>{template.template_code ? `${template.template_code} - ` : ''}{template.name}</option>)}
          </select>
        </label>
      </div>
      {!equipment.length && <p className="mt-4 text-sm text-amber-700">Cadastre um equipamento antes de iniciar uma inspeção.</p>}
      {equipmentId && !availableTemplates.length && <p className="mt-4 text-sm text-amber-700">Não há fichas FP cadastradas. Cadastre um template FP01–FP12 antes de iniciar.</p>}
      <button type="button" disabled={!equipmentId || !templateId} onClick={() => router.push(`/inspecoes/nova?equipmentId=${equipmentId}&templateId=${templateId}`)} className="mt-5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Abrir ficha de inspeção</button>
    </div>
  )
}
