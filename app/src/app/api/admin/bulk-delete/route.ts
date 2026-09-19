import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { getAuthenticatedTenant } from '@/shared/lib/supabase/tenant'

const schema = z.object({
  entity: z.enum(['equipment', 'inspections', 'kits', 'clients', 'manufacturers', 'services']),
  confirmation: z.literal('EXCLUIR'),
})

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Confirmação inválida.' }, { status: 422 })

  try {
    const supabase = createServerSupabaseClient()
    const { user, tenantId } = await getAuthenticatedTenant(supabase)
    const { data: profile, error: profileError } = await supabase.from('users').select('is_super_master').eq('id', user.id).single()
    if (profileError) throw profileError
    if (!profile?.is_super_master) throw new Error('Operação exclusiva do SUPERIOR_MASTER.')

    const { entity } = parsed.data
    let deleted = 0
    if (entity === 'equipment') {
      const { data: equipment, error: equipmentError } = await supabase.from('equipment').select('id').eq('tenant_id', tenantId).is('deleted_at', null)
      if (equipmentError) throw equipmentError
      const ids = (equipment ?? []).map((item) => item.id)
      if (ids.length) {
        const { error: inspectionsError } = await supabase.from('inspections').update({ deleted_at: new Date().toISOString(), updated_by: user.id }).in('equipment_id', ids).eq('tenant_id', tenantId).is('deleted_at', null)
        if (inspectionsError) throw inspectionsError
      }
      const { error } = await supabase.from('equipment').update({ deleted_at: new Date().toISOString(), updated_by: user.id }).eq('tenant_id', tenantId).is('deleted_at', null)
      if (error) throw error
      deleted = ids.length
    } else {
      const { count, error } = await supabase.from(entity).update({ deleted_at: new Date().toISOString(), updated_by: user.id }, { count: 'exact' }).eq('tenant_id', tenantId).is('deleted_at', null)
      if (error) throw error
      deleted = count ?? 0
    }

    await supabase.rpc('log_audit', {
      p_action: 'bulk_delete',
      p_entity: entity,
      p_entity_id: null,
      p_metadata: { entity, deleted_count: deleted, user_id: user.id, tenant_id: tenantId },
    })
    return NextResponse.json({ success: true, deleted })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Não foi possível excluir os dados.' }, { status: 400 })
  }
}
