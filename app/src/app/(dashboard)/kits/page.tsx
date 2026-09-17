import Link from 'next/link'
import { listKits } from '@/modules/kits/service'
import { KitForm } from '@/modules/kits/components/KitForm'
import { listClients } from '@/modules/inventory/service'
import { listEquipment } from '@/modules/equipment/service'

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativo',
  quarantine: 'Quarentena',
  blocked: 'Bloqueado',
  retired: 'Aposentado',
  lost: 'Extraviado',
}

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  quarantine: 'bg-yellow-100 text-yellow-800',
  blocked: 'bg-red-100 text-red-800',
  retired: 'bg-gray-100 text-gray-600',
  lost: 'bg-red-100 text-red-800',
}

export default async function KitsPage() {
  const [kits, clients, equipment] = await Promise.all([listKits(), listClients(), listEquipment()])

  const activeKits = kits.filter((kit: any) => kit.status === 'active').length
  const attentionKits = kits.filter((kit: any) => ['quarantine', 'blocked', 'lost'].includes(kit.status)).length

  return (
    <section>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Kits</h1>
          <p className="mt-1 text-sm text-brand-900/70">Conjuntos de equipamentos e seus componentes rastreáveis.</p>
        </div>
        <KitForm clients={clients} equipment={equipment} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-brand-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-brand-700/70">Total de kits</p>
          <p className="mt-2 text-2xl font-semibold">{kits.length}</p>
        </div>
        <div className="rounded-lg border border-brand-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-brand-700/70">Operacionais</p>
          <p className="mt-2 text-2xl font-semibold text-green-700">{activeKits}</p>
        </div>
        <div className="rounded-lg border border-brand-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-brand-700/70">Exigem atenção</p>
          <p className="mt-2 text-2xl font-semibold text-red-700">{attentionKits}</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-brand-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-left text-xs uppercase text-brand-700/70">
            <tr>
              <th className="px-4 py-3">Kit</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Componentes</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {kits.map((kit: any) => (
              <tr key={kit.id}>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/kits/${kit.id}`} className="text-brand-700 hover:underline">
                    {kit.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{kit.code ?? '—'}</td>
                <td className="px-4 py-3">{kit.client?.name ?? 'FP Soluções'}</td>
                <td className="px-4 py-3">{kit.items?.length ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLOR[kit.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[kit.status] ?? kit.status}
                  </span>
                </td>
                <td className="px-4 py-3"><KitForm kit={kit} clients={clients} equipment={equipment} /></td>
              </tr>
            ))}
            {!kits.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-brand-700/60">
                  Nenhum kit cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
