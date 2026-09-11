import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { softDeleteService, updateService } from '@/modules/services/service'

const schema = z.object({
  client_id: z.string().uuid().optional(),
  work_order: z.string().trim().min(1).optional(),
  requested_at: z.string().date().optional(),
  received_at: z.string().date().optional(),
  status: z.enum(['received', 'in_inspection', 'in_maintenance', 'completed', 'delivered', 'cancelled']).optional(),
  notes: z.string().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try { return NextResponse.json({ data: await updateService(params.id, parsed.data) }) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao atualizar serviço.' }, { status: 400 }) }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try { await softDeleteService(params.id); return NextResponse.json({ success: true }) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao excluir serviço.' }, { status: 400 }) }
}
