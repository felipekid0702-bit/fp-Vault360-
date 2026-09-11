import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createManufacturer, listManufacturers } from '@/modules/inventory/service'

const schema = z.object({ name: z.string().min(1), country: z.string().optional(), website: z.string().url().optional() })

export async function GET() {
  try { return NextResponse.json({ data: await listManufacturers() }) }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try { return NextResponse.json({ data: await createManufacturer(parsed.data) }, { status: 201 }) }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}