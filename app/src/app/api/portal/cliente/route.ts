import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: auth } = await supabase.auth.getUser()
    const { data: user, error: userError } = await supabase.from('users').select('tenant_id, full_name').eq('id', auth.user?.id ?? '').single()
    if (userError) throw userError
    if (!user?.tenant_id) throw new Error('Usuário não possui tenant de cliente')
    const [equipment, inspections, certifications, reports] = await Promise.all([
      supabase.from('equipment').select('id, model, serial_number, internal_code, status, expiration_date, location_id').eq('tenant_id', user.tenant_id).is('deleted_at', null),
      supabase.from('inspections').select('id, equipment_id, performed_at, result, verdict, next_due_date, template_id').eq('tenant_id', user.tenant_id).is('deleted_at', null).order('performed_at', { ascending: false }),
      supabase.from('user_certifications').select('id, issued_at, expires_at, status, certification:certifications(name)').eq('tenant_id', user.tenant_id),
      supabase.from('inspection_reports').select('id, inspection_id, report_number, generated_at, document_path').eq('tenant_id', user.tenant_id).order('generated_at', { ascending: false }),
    ])
    const failure = [equipment, inspections, certifications, reports].find((result) => result.error)
    if (failure?.error) throw failure.error
    return NextResponse.json({ data: { user, equipment: equipment.data, inspections: inspections.data, certifications: certifications.data, reports: reports.data } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
