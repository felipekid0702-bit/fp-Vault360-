import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createCertification, listCertifications } from '@/modules/training/service'

const schema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  validity_months: z.number().int().positive().optional(),
  description: z.string().optional(),
})

export async function GET() {
  try { return NextResponse.json({ data: await listCertifications() }) }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try { return NextResponse.json({ data: await createCertification(parsed.data) }, { status: 201 }) }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}
