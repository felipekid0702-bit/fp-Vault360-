import { listClients } from '@/modules/inventory/service'
import { UserAccessManager } from './UserAccessManager'

export default async function SettingsPage() {
  const clients = await listClients()
  return <section><h1 className="text-xl font-semibold">Configurações</h1><p className="mt-1 text-sm text-brand-900/70">Gerencie acessos e redefinições de senha conforme o vínculo operacional.</p><UserAccessManager clients={clients.map((client: any) => ({ id: client.id, name: client.name }))} /></section>
}
