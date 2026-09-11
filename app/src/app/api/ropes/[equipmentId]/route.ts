import { NextRequest, NextResponse } from 'next/server'
import { getRopeDetails, listRopeUsageHistory } from '@/modules/ropes/service'

// GET /api/ropes/[equipmentId]
export async function GET(_req: NextRequest, { params }: { params: { equipmentId: string } }) {
  try {
    const [details, history] = await Promise.all([
      getRopeDetails(params.equipmentId),
      listRopeUsageHistory(params.equipmentId),
    ])
    return NextResponse.json({ data: { ...details, history } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
}
