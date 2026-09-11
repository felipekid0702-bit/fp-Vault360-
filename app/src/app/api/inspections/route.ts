import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { listInspections, createInspection } from '@/modules/inspections/service'

const inspectionInputSchema = z.object({
  equipment_id: z.string().uuid(),
  kit_id: z.string().uuid().optional(),
  template_id: z.string().uuid(),
  type: z.enum(['acquisition', 'pre_use', 'periodic', 'extraordinary', 'post_fall']),
  notes: z.string().optional(),
  history_notes: z.string().optional(),
  inspection_location: z.string().trim().min(1),
  history_fall: z.boolean().default(false),
  history_chemical_or_abrasive: z.boolean().default(false),
  history_temperature_out_of_range: z.boolean().default(false),
  history_unauthorized_modification: z.boolean().default(false),
  verdict: z.enum(['fit', 'unfit']),
  next_due_date: z.string().date(),
  evidence_paths: z.array(z.string().trim().min(1)).default([]),
  signature_image_path: z.string().trim().min(1).optional(),
  overall_result: z.enum(['approved', 'approved_with_restriction', 'rejected']).optional(),
  items: z
    .array(
      z.object({
        checklist_item_id: z.string().uuid(),
        status: z.enum(['ok', 'nok', 'na']),
        classification: z.enum(['C', 'B', 'AV', 'AR', 'R']),
        observation: z.string().optional(),
        action_required: z.string().optional(),
      })
    )
    .min(1, 'Informe ao menos um item do checklist'),
})

function validateInspectionItems(
  data: Pick<z.infer<typeof inspectionInputSchema>, 'items' | 'verdict' | 'evidence_paths' | 'signature_image_path' | 'history_fall' | 'history_chemical_or_abrasive' | 'history_temperature_out_of_range' | 'history_unauthorized_modification'>
) {
  const { items, verdict } = data
  const invalid = items.find((item) => ['AV', 'AR', 'R'].includes(item.classification) && (!item.observation?.trim() || !item.action_required?.trim()))
  if (invalid) return 'Informe a observação para itens classificados como AV, AR ou R.'
  const inconsistent = items.find((item) => ['AR', 'R'].includes(item.classification) && item.status !== 'nok')
  if (inconsistent) return 'Itens AR ou R devem ser registrados como NOK.'
  if (items.some((item) => ['AR', 'R'].includes(item.classification)) && verdict !== 'unfit') {
    return 'Itens AR ou R exigem veredito INAPTO.'
  }
  const requiresEvidence =
    items.some((item) => ['AR', 'R'].includes(item.classification)) ||
    data.history_fall ||
    data.history_chemical_or_abrasive ||
    data.history_temperature_out_of_range ||
    data.history_unauthorized_modification
  if (requiresEvidence && data.evidence_paths.length === 0) return 'Evidência fotográfica é obrigatória para este resultado.'
  if (!data.signature_image_path) return 'Assinatura do controlador é obrigatória para concluir a ficha.'
  if (
    (data.history_fall ||
      data.history_chemical_or_abrasive ||
      data.history_temperature_out_of_range ||
      data.history_unauthorized_modification) &&
    verdict !== 'unfit'
  ) {
    return 'Gatilhos históricos FP exigem veredito INAPTO.'
  }
  const rejected = items.find((item) => item.classification === 'R' && !/quarentena|descarte|retirad/i.test(item.action_required ?? ''))
  if (rejected) return 'Itens R exigem ação de quarentena, descarte ou retirada de serviço.'
  return null
}

// GET /api/inspections?equipmentId=...&result=rejected
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  try {
    const data = await listInspections({
      equipmentId: searchParams.get('equipmentId') ?? undefined,
      result: searchParams.get('result') ?? undefined,
    })
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

// POST /api/inspections
export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = inspectionInputSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }
  const validationError = validateInspectionItems(parsed.data)
  if (validationError) return NextResponse.json({ error: validationError }, { status: 422 })

  try {
    const data = await createInspection(parsed.data)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
