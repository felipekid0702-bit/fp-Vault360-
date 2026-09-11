import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { registerRopeCut } from '@/modules/ropes/service'

const cutSchema = z.object({
  equipment_id: z.string().uuid(),
  cut_length_m: z.number().positive('O comprimento cortado deve ser maior que zero'),
  reason: z.string().optional(),
})

// POST /api/ropes/cuts
export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = cutSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  try {
    const data = await registerRopeCut(parsed.data)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
