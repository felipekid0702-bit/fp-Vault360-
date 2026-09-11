import { getChecklistTemplate, listInspectionTargets } from '@/modules/inspections/service'
import { ChecklistForm } from '@/modules/inspections/components/ChecklistForm'
import { InlineEquipmentCreate } from '@/modules/inspections/components/InlineEquipmentCreate'
import { listCategories } from '@/modules/inventory/service'
import { InspectionSelector } from './InspectionSelector'

// Uso: /inspecoes/nova?equipmentId=...&templateId=...
// (o link de "Nova Inspeção" a partir da ficha do equipamento já injeta esses parâmetros)
export default async function NewInspectionPage({
  searchParams,
}: {
  searchParams: { equipmentId?: string; templateId?: string }
}) {
  if (!searchParams.equipmentId || !searchParams.templateId) {
    const [targets, categories] = await Promise.all([listInspectionTargets(), listCategories()])
    return (
      <section><h1 className="text-xl font-semibold">Nova Inspeção</h1><InspectionSelector equipment={targets.equipment as any} templates={targets.templates} />{targets.templates.map((template: any) => <div key={template.id} className="mt-3"><InlineEquipmentCreate templateId={template.id} categories={categories} /></div>)}</section>
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
          templateName={`${template.template_code ?? 'FP'} - ${template.name.replace(/^FP\d+\s*-\s*/, '')}`}
          inspectionType={template.inspection_type}
          objective={template.objective}
          items={template.items}
        />
      </div>
    </div>
  )
}
