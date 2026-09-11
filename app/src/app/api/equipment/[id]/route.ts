import { NextRequest, NextResponse } from 'next/server'
import { getEquipmentById, updateEquipment, softDeleteEquipment } from '@/modules/equipment/service'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await getEquipmentById(params.id)
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  try {
    const data = await updateEquipment(params.id, body)
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await softDeleteEquipment(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
