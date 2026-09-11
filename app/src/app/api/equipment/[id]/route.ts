import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getEquipmentById, updateEquipment, softDeleteEquipment } from '@/modules/equipment/service'

const updateSchema = z.object({
  model: z.string().min(1).optional(),
  category_id: z.string().uuid().optional(),
  manufacturer_id: z.string().uuid().optional(),
  owner_type: z.enum(['fp', 'client']).optional(),
  client_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
  internal_code: z.string().optional(),
  serial_number: z.string().optional(),
  acquisition_date: z.string().date().optional(),
  lifespan_months: z.number().int().positive().optional(),
  notes: z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await getEquipmentById(params.id)
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = updateSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  if (parsed.data.owner_type === 'client' && !parsed.data.client_id) {
    return NextResponse.json({ error: 'Cliente é obrigatório para equipamento de cliente.' }, { status: 422 })
  }
  if (parsed.data.owner_type === 'fp' && parsed.data.client_id) {
    return NextResponse.json({ error: 'Equipamento FP não pode ter cliente proprietário.' }, { status: 422 })
  }
  try {
    const data = await updateEquipment(params.id, parsed.data)
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await softDeleteEquipment(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
