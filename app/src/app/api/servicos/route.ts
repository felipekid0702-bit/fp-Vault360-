import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createService, listServices } from '@/modules/services/service'

const schema = z.object({
  client_id: z.string().uuid(),
  work_order: z.string().trim().min(1),
  requested_at: z.string().date().optional(),
  received_at: z.string().date().optional(),
  status: z.enum(['received', 'in_inspection', 'in_maintenance', 'completed', 'delivered', 'cancelled']).optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ data: await listServices(new URL(request.url).searchParams.get('client_id') ?? undefined) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao listar serviços.' }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try {
    return NextResponse.json({ data: await createService(parsed.data) }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao criar serviço.' }, { status: 400 })
  }
}
