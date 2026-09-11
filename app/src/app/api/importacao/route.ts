import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createImportJob, listImportJobs } from '@/modules/imports/service'

const schema = z.object({
  entity: z.enum(['equipment', 'kits', 'users', 'trainings']),
  file_path: z.string().min(1),
  layout_id: z.string().uuid().optional(),
  total_rows: z.number().int().nonnegative().optional(),
})

export async function GET() {
  try { return NextResponse.json({ data: await listImportJobs() }) }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try { return NextResponse.json({ data: await createImportJob(parsed.data) }, { status: 201 }) }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}
