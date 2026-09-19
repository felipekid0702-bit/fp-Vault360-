import { listClients } from '@/modules/inventory/service'
import { UserAccessManager } from './UserAccessManager'
import { BulkDeleteManager } from './BulkDeleteManager'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

export default async function SettingsPage() {
  const clients = await listClients()
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data: profile } = auth.user ? await supabase.from('users').select('is_super_master').eq('id', auth.user.id).maybeSingle() : { data: null }
  return <section><h1 className="text-xl font-semibold">Configurações</h1><p className="mt-1 text-sm text-brand-900/70">Gerencie acessos e redefinições de senha conforme o vínculo operacional.</p><UserAccessManager clients={clients.map((client: any) => ({ id: client.id, name: client.name }))} />{profile?.is_super_master && <div className="mt-6"><BulkDeleteManager /></div>}</section>
}
