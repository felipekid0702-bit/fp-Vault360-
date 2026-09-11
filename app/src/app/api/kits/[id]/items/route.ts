import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { replaceKitEquipment } from '@/modules/kits/service'

const schema = z.object({ equipment_ids: z.array(z.string().uuid()) })

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try {
    return NextResponse.json({ data: await replaceKitEquipment(params.id, parsed.data.equipment_ids) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível vincular os equipamentos.' }, { status: 400 })
  }
}
