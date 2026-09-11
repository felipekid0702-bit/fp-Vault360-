import { listClients } from '@/modules/inventory/service'
import { listServices } from '@/modules/services/service'
import { ServiceForm } from '@/modules/services/components/ServiceForm'

export default async function ServicesPage() {
  const [services, clients] = await Promise.all([listServices(), listClients()])
  return (
    <section>
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">Serviços</h1><p className="mt-1 text-sm text-brand-900/70">Ordens de serviço e rastreabilidade operacional por cliente.</p></div>
        <ServiceForm clients={clients} />
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border border-brand-100 bg-white">
        <table className="w-full text-sm"><thead className="bg-brand-50 text-left text-xs uppercase text-brand-700/70"><tr><th className="px-4 py-3">OS</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Pedido</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Ações</th></tr></thead>
          <tbody className="divide-y divide-brand-50">{services.map((service: any) => <tr key={service.id}><td className="px-4 py-3 font-medium">{service.work_order}</td><td className="px-4 py-3">{service.client?.name ?? '—'}</td><td className="px-4 py-3">{service.requested_at}</td><td className="px-4 py-3">{service.status}</td><td className="px-4 py-3"><ServiceForm service={service} clients={clients} /></td></tr>)}{!services.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-brand-700/60">Nenhum serviço cadastrado.</td></tr>}</tbody>
        </table>
      </div>
    </section>
  )
}
