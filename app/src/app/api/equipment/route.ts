import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { listEquipment, createEquipment } from '@/modules/equipment/service'

const equipmentInputSchema = z.object({
  model: z.string().min(1, 'Modelo é obrigatório'),
  category_id: z.string().uuid().optional(),
  manufacturer_id: z.string().uuid().optional(),
  owner_type: z.enum(['fp', 'client']).default('fp'),
  client_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
  cost_center_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  internal_code: z.string().optional(),
  serial_number: z.string().optional(),
  manufacture_date: z.string().date().optional(),
  acquisition_date: z.string().date().optional(),
  first_use_date: z.string().date().optional(),
  invoice_number: z.string().trim().max(120).optional(),
  lifespan_months: z.number().int().positive().optional(),
  certification: z.string().optional(),
  ca_number: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/equipment?status=active&search=corda
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  try {
    const data = await listEquipment({
      status: (searchParams.get('status') as any) ?? undefined,
      search: searchParams.get('search') ?? undefined,
      ownerType: (searchParams.get('owner_type') as 'fp' | 'client') ?? undefined,
      clientId: searchParams.get('client_id') ?? undefined,
      manufacturerId: searchParams.get('manufacturer_id') ?? undefined,
      categoryId: searchParams.get('category_id') ?? undefined,
    })
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

// POST /api/equipment
export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = equipmentInputSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }
  if (parsed.data.owner_type === 'client' && !parsed.data.client_id) {
    return NextResponse.json({ error: 'Cliente é obrigatório para equipamento de cliente.' }, { status: 422 })
  }
  if (parsed.data.owner_type === 'fp' && parsed.data.client_id) {
    return NextResponse.json({ error: 'Equipamento FP não pode ter cliente proprietário.' }, { status: 422 })
  }

  try {
    const data = await createEquipment(parsed.data)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
