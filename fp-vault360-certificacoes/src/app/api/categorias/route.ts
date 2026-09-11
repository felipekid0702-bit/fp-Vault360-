import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createCategory, listCategories } from '@/modules/inventory/service'

const schema = z.object({ name: z.string().min(1), code: z.string().optional(), default_lifespan_months: z.number().int().positive().optional() })

export async function GET() {
  try { return NextResponse.json({ data: await listCategories() }) }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try { return NextResponse.json({ data: await createCategory(parsed.data) }, { status: 201 }) }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}