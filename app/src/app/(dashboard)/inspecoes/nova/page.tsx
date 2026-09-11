import { getChecklistTemplate } from '@/modules/inspections/service'
import { ChecklistForm } from '@/modules/inspections/components/ChecklistForm'

// Uso: /inspecoes/nova?equipmentId=...&templateId=...
// (o link de "Nova Inspeção" a partir da ficha do equipamento já injeta esses parâmetros)
export default async function NewInspectionPage({
  searchParams,
}: {
  searchParams: { equipmentId?: string; templateId?: string }
}) {
  if (!searchParams.equipmentId || !searchParams.templateId) {
    return (
      <div className="text-sm text-brand-700/70">
        Selecione um equipamento na tela de Equipamentos e clique em "Nova Inspeção" para começar.
      </div>
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
          items={template.items}
        />
      </div>
    </div>
  )
}
