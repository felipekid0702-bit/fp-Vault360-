import { NextResponse } from 'next/server'
import { getDashboardSummary } from '@/modules/bi/service'

export async function GET() {
  try { return NextResponse.json({ data: await getDashboardSummary() }) }
  catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
}
