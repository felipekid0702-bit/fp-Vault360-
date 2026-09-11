import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { listInspections, createInspection } from '@/modules/inspections/service'

const inspectionInputSchema = z.object({
  equipment_id: z.string().uuid(),
  kit_id: z.string().uuid().optional(),
  template_id: z.string().uuid(),
  type: z.enum(['acquisition', 'pre_use', 'periodic', 'extraordinary', 'post_fall']),
  notes: z.string().optional(),
  next_due_date: z.string().date().optional(),
  overall_result: z.enum(['approved', 'approved_with_restriction', 'rejected']).optional(),
  items: z
    .array(
      z.object({
        checklist_item_id: z.string().uuid(),
        status: z.enum(['ok', 'nok', 'na']),
        observation: z.string().optional(),
      })
    )
    .min(1, 'Informe ao menos um item do checklist'),
})

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

  try {
    const data = await createInspection(parsed.data)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
