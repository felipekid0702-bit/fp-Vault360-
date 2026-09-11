import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createContract, listContracts } from '@/modules/contracts/service'

const schema = z.object({
  client_tenant_id: z.string().uuid(),
  contract_number: z.string().optional(),
  scope: z.string().optional(),
  sla_days: z.number().int().positive().optional(),
  responsible_team: z.string().optional(),
  equipment_quantity: z.number().int().nonnegative().optional(),
  inspection_frequency: z.string().optional(),
  start_date: z.string().date(),
  end_date: z.string().date().optional(),
  scopes: z.array(z.object({ description: z.string().min(1), category_id: z.string().uuid().optional() })).optional(),
})

export async function GET() {
  try { return NextResponse.json({ data: await listContracts() }) }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try { return NextResponse.json({ data: await createContract(parsed.data) }, { status: 201 }) }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}
