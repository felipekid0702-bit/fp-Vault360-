import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: auth } = await supabase.auth.getUser()
    const { data: user, error: userError } = await supabase.from('users').select('tenant_id, client_id, full_name').eq('id', auth.user?.id ?? '').single()
    if (userError) throw userError
    if (!user?.tenant_id) throw new Error('Usuário não possui tenant de cliente')
    if (!user.client_id) throw new Error('Usuário de cliente não possui cadastro vinculado')
    const [equipment, services, certifications] = await Promise.all([
      supabase.from('equipment').select('id, model, serial_number, internal_code, status, expiration_date, location_id').eq('tenant_id', user.tenant_id).eq('client_id', user.client_id).is('deleted_at', null),
      supabase.from('services').select('id, work_order, requested_at, received_at, status, notes').eq('tenant_id', user.tenant_id).eq('client_id', user.client_id).is('deleted_at', null).order('requested_at', { ascending: false }),
      supabase.from('user_certifications').select('id, issued_at, expires_at, status, certification:certifications(name)').eq('tenant_id', user.tenant_id),
    ])
    const equipmentIds = (equipment.data ?? []).map((item) => item.id)
    const inspections = equipmentIds.length
      ? await supabase.from('inspections').select('id, equipment_id, performed_at, result, verdict, next_due_date, template_id').eq('tenant_id', user.tenant_id).in('equipment_id', equipmentIds).is('deleted_at', null).order('performed_at', { ascending: false })
      : { data: [], error: null }
    const inspectionIds = (inspections.data ?? []).map((item) => item.id)
    const reports = inspectionIds.length
      ? await supabase.from('inspection_reports').select('id, inspection_id, report_number, generated_at, document_path').eq('tenant_id', user.tenant_id).in('inspection_id', inspectionIds).order('generated_at', { ascending: false })
      : { data: [], error: null }
    const failure = [equipment, services, inspections, certifications, reports].find((result) => result.error)
    if (failure?.error) throw failure.error
    return NextResponse.json({ data: { user, equipment: equipment.data, services: services.data, inspections: inspections.data, certifications: certifications.data, reports: reports.data } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
