import Link from 'next/link'
import { getChecklistTemplate, listInspectionTargets } from '@/modules/inspections/service'
import { ChecklistForm } from '@/modules/inspections/components/ChecklistForm'

// Uso: /inspecoes/nova?equipmentId=...&templateId=...
// (o link de "Nova Inspeção" a partir da ficha do equipamento já injeta esses parâmetros)
export default async function NewInspectionPage({
  searchParams,
}: {
  searchParams: { equipmentId?: string; templateId?: string }
}) {
  if (!searchParams.equipmentId || !searchParams.templateId) {
    const targets = await listInspectionTargets()
    return (
      <section><h1 className="text-xl font-semibold">Nova Inspeção</h1><p className="mt-1 text-sm text-brand-900/70">Selecione o equipamento e o checklist que serão usados.</p><div className="mt-6 overflow-hidden rounded-lg border border-brand-100 bg-white"><table className="w-full text-sm"><thead className="bg-brand-50 text-left text-xs uppercase text-brand-700/70"><tr><th className="px-4 py-3">Equipamento</th><th className="px-4 py-3">Checklist disponível</th><th className="px-4 py-3">Ação</th></tr></thead><tbody className="divide-y divide-brand-50">{targets.equipment.flatMap((item: any) => targets.templates.filter((template: any) => !template.category_id || template.category_id === item.category_id).map((template: any) => <tr key={`${item.id}-${template.id}`}><td className="px-4 py-3 font-medium">{item.model} {item.serial_number ? `· ${item.serial_number}` : ''}</td><td className="px-4 py-3">{template.name}</td><td className="px-4 py-3"><Link href={`/inspecoes/nova?equipmentId=${item.id}&templateId=${template.id}`} className="text-brand-700 underline">Iniciar</Link></td></tr>))}{(!targets.equipment.length || !targets.templates.length) && <tr><td colSpan={3} className="px-4 py-10 text-center text-brand-700/60">Cadastre equipamentos e checklists ativos para iniciar uma inspeção.</td></tr>}</tbody></table></div></section>
    )
  }

  const template = await getChecklistTemplate(searchParams.templateId)

  return (
    <div>
      <h1 className="text-xl font-semibold">Nova Inspeção</h1>
      <div className="mt-6">
        <ChecklistForm
          equipmentId={searchParams.equipmentId}
          templateId={template.id}
          templateName={template.name}
          inspectionType={template.inspection_type}
          objective={template.objective}
          items={template.items}
        />
      </div>
    </div>
  )
}
