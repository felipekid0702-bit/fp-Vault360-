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
  verdict: z.enum(['fit', 'unfit']),
  next_due_date: z.string().date().optional(),
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

function validateInspectionItems(items: z.infer<typeof inspectionInputSchema>['items'], verdict: 'fit' | 'unfit') {
  const invalid = items.find((item) => ['AV', 'AR', 'R'].includes(item.classification) && !item.observation?.trim())
  if (invalid) return 'Informe a observação para itens classificados como AV, AR ou R.'
  const inconsistent = items.find((item) => ['AR', 'R'].includes(item.classification) && item.status !== 'nok')
  if (inconsistent) return 'Itens AR ou R devem ser registrados como NOK.'
  if (items.some((item) => ['AR', 'R'].includes(item.classification)) && verdict !== 'unfit') {
    return 'Itens AR ou R exigem veredito INAPTO.'
  }
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
  const validationError = validateInspectionItems(parsed.data.items, parsed.data.verdict)
  if (validationError) return NextResponse.json({ error: validationError }, { status: 422 })

  try {
    const data = await createInspection(parsed.data)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
