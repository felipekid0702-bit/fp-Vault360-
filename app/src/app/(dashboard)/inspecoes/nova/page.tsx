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
      <section>
        <h1 className="text-xl font-semibold">Nova Inspeção</h1>
        <InspectionSelector equipment={targets.equipment as any} templates={targets.templates} />
        <div className="mt-4">
          <InlineEquipmentCreate categories={categories} />
        </div>
      </section>
    )
  }

  const template = await getChecklistTemplate(searchParams.templateId)

  return (
    <div>
      <h1 className="text-xl font-semibold">Nova Inspeção</h1>
      <div className="mt-6">
        <ChecklistForm
          equipmentId={searchParams.equipmentId}
          equipment={await getEquipmentForInspection(searchParams.equipmentId)}
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

async function getEquipmentForInspection(equipmentId: string) {
  const { createServerSupabaseClient } = await import('@/shared/lib/supabase/server')
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('equipment')
    .select('id, model, serial_number, internal_code, category:equipment_categories(name), manufacturer:manufacturers(name), client:clients(name)')
    .eq('id', equipmentId)
    .single()
  if (error) throw error
  return {
    ...data,
    category: Array.isArray(data.category) ? data.category[0] : data.category,
    manufacturer: Array.isArray(data.manufacturer) ? data.manufacturer[0] : data.manufacturer,
    client: Array.isArray(data.client) ? data.client[0] : data.client,
  }
}
