import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { softDeleteClient, updateClient } from '@/modules/inventory/service'

const schema = z.object({
  name: z.string().trim().min(1).optional(),
  legal_name: z.string().optional(),
  cnpj: z.string().trim().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  primary_contact: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try {
    return NextResponse.json({ data: await updateClient(params.id, parsed.data) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao atualizar cliente.' }, { status: 400 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await softDeleteClient(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao excluir cliente.' }, { status: 400 })
  }
}
