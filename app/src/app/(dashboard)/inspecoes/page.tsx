import Link from 'next/link'
import { listInspections } from '@/modules/inspections/service'
import { formatDateBR } from '@/shared/lib/dates'

const TYPE_LABEL: Record<string, string> = {
  acquisition: 'Aquisição',
  pre_use: 'Pré-Uso',
  periodic: 'Periódica',
  extraordinary: 'Extraordinária',
  post_fall: 'Pós-Queda',
}

const RESULT_LABEL: Record<string, string> = {
  approved: 'Aprovado',
  approved_with_restriction: 'Aprovado c/ restrição',
  rejected: 'Reprovado',
}

const RESULT_COLOR: Record<string, string> = {
  approved: 'bg-green-100 text-green-800',
  approved_with_restriction: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
}

export default async function InspectionsPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1)
  const inspections = await listInspections({ page })

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Inspeções</h1>
        <Link
          href="/inspecoes/nova"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Nova Inspeção
        </Link>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-sm">
        {page > 1 && <Link href={`/inspecoes?page=${page - 1}`} className="rounded border border-brand-200 px-3 py-2 text-brand-700">Anterior</Link>}
        <span className="text-brand-900/60">Página {page}</span>
        {inspections?.length === 50 && <Link href={`/inspecoes?page=${page + 1}`} className="rounded border border-brand-200 px-3 py-2 text-brand-700">Próxima</Link>}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-brand-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-left text-xs uppercase text-brand-700/70">
            <tr>
              <th className="px-4 py-3">Equipamento</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Inspetor</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Próx. Vencimento</th>
              <th className="px-4 py-3">Resultado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {inspections?.map((item: any) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/inspecoes/${item.id}`} className="text-brand-700 hover:underline">
                    {item.equipment?.model} {item.equipment?.serial_number ? `· ${item.equipment.serial_number}` : ''}
                  </Link>
                </td>
                <td className="px-4 py-3">{TYPE_LABEL[item.type]}</td>
                <td className="px-4 py-3">{item.inspector?.full_name ?? '—'}</td>
                <td className="px-4 py-3">{formatDateBR(item.performed_at)}</td>
                <td className="px-4 py-3">{formatDateBR(item.next_due_date)}</td>
                <td className="px-4 py-3">
                  {item.result && (
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${RESULT_COLOR[item.result]}`}>
                      {RESULT_LABEL[item.result]}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {!inspections?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-brand-700/60">
                  Nenhuma inspeção registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
