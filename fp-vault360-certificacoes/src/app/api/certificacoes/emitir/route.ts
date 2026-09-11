import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { issueUserCertification } from '@/modules/training/service'

const schema = z.object({
  user_id: z.string().uuid(),
  certification_id: z.string().uuid(),
  training_id: z.string().uuid().optional(),
  issued_at: z.string().date(),
  expires_at: z.string().date().optional(),
  notes: z.string().optional(),
})

// POST /api/certificacoes/emitir
// Vincula uma certificação a um colaborador (grava em user_certifications).
export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try { return NextResponse.json({ data: await issueUserCertification(parsed.data) }, { status: 201 }) }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}
