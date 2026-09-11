import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

const schema = z.object({
  equipment_id: z.string().uuid(),
  movement_type: z.enum(['stock', 'dispatch', 'unit_transfer', 'return', 'inspection_release', 'quarantine', 'maintenance', 'disposal']),
  from_location_id: z.string().uuid().optional(),
  to_location_id: z.string().uuid().optional(),
  from_tenant_id: z.string().uuid().optional(),
  to_tenant_id: z.string().uuid().optional(),
  responsible_user_id: z.string().uuid().optional(),
  occurred_at: z.string().datetime().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    let query = supabase.from('equipment_movements').select('*, equipment(model, serial_number)').order('occurred_at', { ascending: false })
    const equipmentId = new URL(request.url).searchParams.get('equipmentId')
    if (equipmentId) query = query.eq('equipment_id', equipmentId)
    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  try {
    const supabase = createServerSupabaseClient()
    const { data: auth } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', auth.user?.id ?? '').single()
    if (!profile?.tenant_id) throw new Error('Usuário não possui tenant')
    const { data, error } = await supabase.from('equipment_movements').insert({ ...parsed.data, tenant_id: profile.tenant_id, created_by: auth.user?.id }).select().single()
    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
