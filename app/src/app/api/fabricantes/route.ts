import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createManufacturer, listManufacturers } from '@/modules/inventory/service'

const schema = z.object({ name: z.string().trim().min(1), website: z.string().url().optional(), notes: z.string().optional(), status: z.enum(['active', 'inactive']).optional() })

export async function GET(request: NextRequest) {
  try { return NextResponse.json({ data: await listManufacturers(new URL(request.url).searchParams.get('search') ?? undefined) }) }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try { return NextResponse.json({ data: await createManufacturer(parsed.data) }, { status: 201 }) }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}