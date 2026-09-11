import { listEquipment } from '@/modules/equipment/service'
import { EquipmentForm } from '@/modules/equipment/components/EquipmentForm'

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

export default async function EquipmentPage() {
  const equipment = await listEquipment()

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Equipamentos</h1>
        <EquipmentForm />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-brand-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-left text-xs uppercase text-brand-700/70">
            <tr>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Nº Série</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Fabricante</th>
              <th className="px-4 py-3">Validade</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {equipment?.map((item: any) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium">{item.model}</td>
                <td className="px-4 py-3">{item.serial_number ?? '—'}</td>
                <td className="px-4 py-3">{item.category?.name ?? '—'}</td>
                <td className="px-4 py-3">{item.manufacturer?.name ?? '—'}</td>
                <td className="px-4 py-3">{item.expiration_date ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLOR[item.status]}`}>
                    {STATUS_LABEL[item.status]}
                  </span>
                </td>
              </tr>
            ))}
            {!equipment?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-brand-700/60">
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
