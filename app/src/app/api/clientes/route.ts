import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, listClients } from '@/modules/inventory/service'

const schema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  legal_name: z.string().optional(),
  cnpj: z.string().trim().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  primary_contact: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ data: await listClients(new URL(request.url).searchParams.get('search') ?? undefined) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao listar clientes.' }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try {
    return NextResponse.json({ data: await createClient(parsed.data) }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao cadastrar cliente.' }, { status: 400 })
  }
}
