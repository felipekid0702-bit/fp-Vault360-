import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { formatDateBR } from '@/shared/lib/dates'

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: auth } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', auth.user?.id ?? '').single()
    if (!profile?.tenant_id) throw new Error('Usuário não possui tenant')
    const [equipment, certifications] = await Promise.all([
      supabase.from('equipment').select('id, model, expiration_date').eq('tenant_id', profile.tenant_id).not('expiration_date', 'is', null).lte('expiration_date', new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)).gte('expiration_date', new Date().toISOString().slice(0, 10)),
      supabase.from('user_certifications').select('id, user_id, expires_at').eq('tenant_id', profile.tenant_id).not('expires_at', 'is', null).lte('expires_at', new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)).gte('expires_at', new Date().toISOString().slice(0, 10)),
    ])
    if (equipment.error) throw equipment.error
    if (certifications.error) throw certifications.error
    const notifications = [
      ...(equipment.data ?? []).map((item) => ({ tenant_id: profile.tenant_id, user_id: auth.user?.id, channel: 'email', title: 'Equipamento próximo do vencimento', body: `${item.model} vence em ${formatDateBR(item.expiration_date)}` })),
      ...(certifications.data ?? []).map((item) => ({ tenant_id: profile.tenant_id, user_id: item.user_id, channel: 'email', title: 'Certificação próxima do vencimento', body: `Certificação vence em ${formatDateBR(item.expires_at)}` })),
    ]
    if (notifications.length) {
      const { error } = await supabase.from('notifications').insert(notifications)
      if (error) throw error
    }
    return NextResponse.json({ data: { created: notifications.length } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
