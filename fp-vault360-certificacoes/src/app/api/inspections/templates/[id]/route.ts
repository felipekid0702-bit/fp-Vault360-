import { NextRequest, NextResponse } from 'next/server'
import { getChecklistTemplate } from '@/modules/inspections/service'

// GET /api/inspections/templates/[id] -> retorna o template com seus itens ordenados
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await getChecklistTemplate(params.id)
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
}
