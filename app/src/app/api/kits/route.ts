import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createKit, listKits } from '@/modules/kits/service'

const schema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  description: z.string().optional(),
  client_id: z.string().uuid().optional(),
  parent_equipment_id: z.string().uuid().optional(),
  responsible_user_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  equipment_ids: z.array(z.string().uuid()).optional(),
})

export async function GET() {
  try { return NextResponse.json({ data: await listKits() }) }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try { return NextResponse.json({ data: await createKit(parsed.data) }, { status: 201 }) }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}
