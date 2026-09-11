import { listActiveRopes } from '@/modules/ropes/service'

function wearColor(percent: number) {
  if (percent >= 70) return 'bg-red-100 text-red-800'
  if (percent >= 40) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

export default async function RopesPage() {
  const ropes = await listActiveRopes()

  return (
    <div>
      <h1 className="text-xl font-semibold">Gestão de Cordas</h1>
      <p className="mt-1 text-sm text-brand-700/60">
        Comprimento atual, histórico de cortes e percentual de desgaste calculado automaticamente.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-brand-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-left text-xs uppercase text-brand-700/70">
            <tr>
              <th className="px-4 py-3">Corda</th>
              <th className="px-4 py-3">Comprimento Original</th>
              <th className="px-4 py-3">Comprimento Atual</th>
              <th className="px-4 py-3">Desgaste</th>
              <th className="px-4 py-3">Status Equipamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {ropes?.map((rope: any) => (
              <tr key={rope.equipment_id}>
                <td className="px-4 py-3 font-medium">
                  {rope.equipment?.model} {rope.equipment?.serial_number ? `· ${rope.equipment.serial_number}` : ''}
                </td>
                <td className="px-4 py-3">{rope.original_length_m} m</td>
                <td className="px-4 py-3">{rope.current_length_m} m</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${wearColor(rope.wear_percent)}`}>
                    {rope.wear_percent}%
                  </span>
                </td>
                <td className="px-4 py-3">{rope.equipment?.status}</td>
              </tr>
            ))}
            {!ropes?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-brand-700/60">
                  Nenhuma corda ativa cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
