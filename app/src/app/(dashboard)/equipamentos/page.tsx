import Link from 'next/link'
import { listEquipment } from '@/modules/equipment/service'
import { EquipmentForm } from '@/modules/equipment/components/EquipmentForm'
import { listCategories, listManufacturers, listClients } from '@/modules/inventory/service'
import { listServices } from '@/modules/services/service'
import { listKits } from '@/modules/kits/service'
import { formatDateBR } from '@/shared/lib/dates'

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

export default async function EquipmentPage({ searchParams }: { searchParams: { search?: string; owner_type?: 'fp' | 'client'; client_id?: string; manufacturer_id?: string; category_id?: string; status?: string } }) {
  const [equipment, categories, manufacturers, clients, services, kits] = await Promise.all([
    listEquipment({ search: searchParams.search, ownerType: searchParams.owner_type, clientId: searchParams.client_id, manufacturerId: searchParams.manufacturer_id, categoryId: searchParams.category_id, status: searchParams.status as any }),
    listCategories(),
    listManufacturers(),
    listClients(),
    listServices(),
    listKits(),
  ])

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Equipamentos</h1>
        <EquipmentForm categories={categories} manufacturers={manufacturers} clients={clients} services={services} kits={kits} />
      </div>

      <form className="mt-6 grid gap-3 rounded-lg border border-brand-100 bg-brand-50 p-4 md:grid-cols-6">
        <input name="search" defaultValue={searchParams.search} placeholder="Pesquisar modelo, série ou código" className="rounded border bg-white px-3 py-2 text-sm md:col-span-2" />
        <select name="owner_type" defaultValue={searchParams.owner_type ?? ''} className="rounded border bg-white px-3 py-2 text-sm"><option value="">Todos</option><option value="fp">Equipamentos FP</option><option value="client">Equipamentos Cliente</option></select>
        <select name="client_id" defaultValue={searchParams.client_id ?? ''} className="rounded border bg-white px-3 py-2 text-sm"><option value="">Cliente</option>{clients.map((client: any) => <option key={client.id} value={client.id}>{client.name}</option>)}</select>
        <select name="manufacturer_id" defaultValue={searchParams.manufacturer_id ?? ''} className="rounded border bg-white px-3 py-2 text-sm"><option value="">Fabricante</option>{manufacturers.map((manufacturer: any) => <option key={manufacturer.id} value={manufacturer.id}>{manufacturer.name}</option>)}</select>
        <select name="category_id" defaultValue={searchParams.category_id ?? ''} className="rounded border bg-white px-3 py-2 text-sm"><option value="">Categoria</option>{categories.map((category: any) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
        <select name="status" defaultValue={searchParams.status ?? ''} className="rounded border bg-white px-3 py-2 text-sm"><option value="">Status</option>{Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <button className="rounded bg-brand-600 px-3 py-2 text-sm text-white md:col-span-6 md:w-fit">Filtrar</button>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border border-brand-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-left text-xs uppercase text-brand-700/70">
            <tr>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Nº Série / Lote</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Fabricante</th>
              <th className="px-4 py-3">Validade</th>
              <th className="px-4 py-3">Inspeção</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {equipment?.map((item: any) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/equipamentos/${item.id}`} className="text-brand-700 hover:underline">
                    {item.model}
                  </Link>
                </td>
                <td className="px-4 py-3">{item.serial_number ?? '—'}</td>
                <td className="px-4 py-3">{item.category?.name ?? '—'}</td>
                <td className="px-4 py-3">{item.manufacturer?.name ?? '—'}</td>
                <td className="px-4 py-3">{formatDateBR(item.expiration_date)}</td>
                <td className="px-4 py-3">{item.inspections?.[0]?.result === 'rejected' || item.inspections?.[0]?.verdict === 'unfit' ? 'INAPTO' : item.inspections?.[0]?.result === 'approved_with_restriction' ? 'AV' : item.inspections?.[0] ? 'APTO' : 'Não inspecionado'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLOR[item.status]}`}>
                    {STATUS_LABEL[item.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <EquipmentForm
                    categories={categories}
                    manufacturers={manufacturers}
                    clients={clients}
                    services={services}
                    kits={kits}
                    equipment={item}
                  />
                </td>
              </tr>
            ))}
            {!equipment?.length && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-brand-700/60">
                  Nenhum equipamento cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
