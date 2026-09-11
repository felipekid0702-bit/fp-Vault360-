import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createCertification, listCertifications } from '@/modules/training/service'

const schema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().optional(),
  validity_months: z.number().int().positive().optional(),
})

export async function GET() {
  try {
    return NextResponse.json({ data: await listCertifications() })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível listar as certificações.' }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try {
    return NextResponse.json({ data: await createCertification(parsed.data) }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível cadastrar a certificação.' }, { status: 400 })
  }
}
