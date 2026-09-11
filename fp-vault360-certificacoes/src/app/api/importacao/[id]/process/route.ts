import { NextResponse } from 'next/server'
import { z } from 'zod'
import { processImportJob } from '@/modules/imports/process'

const paramsSchema = z.object({ id: z.string().uuid() })

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(_: Request, context: { params: { id: string } }) {
  const parsed = paramsSchema.safeParse(context.params)
  if (!parsed.success) return NextResponse.json({ error: 'ID de importação inválido' }, { status: 422 })
  try {
    return NextResponse.json({ data: await processImportJob(parsed.data.id) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
