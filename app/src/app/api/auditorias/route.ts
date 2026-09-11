import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAudit, listAudits } from '@/modules/audit/service'

const schema = z.object({ title: z.string().min(1), scope: z.string().optional(), auditor_id: z.string().uuid().optional() })

export async function GET() {
  try { return NextResponse.json({ data: await listAudits() }) }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try { return NextResponse.json({ data: await createAudit(parsed.data) }, { status: 201 }) }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}
