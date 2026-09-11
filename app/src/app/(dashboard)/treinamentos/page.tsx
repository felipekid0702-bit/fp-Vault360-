import { listTrainingStatus } from '@/modules/training/service'
import { TrainingForm } from '@/modules/training/components/TrainingForm'

const STATUS_LABEL: Record<string, string> = {
  valid: 'Válida',
  expiring_soon: 'Vence em breve',
  expired: 'Vencida',
}

const STATUS_COLOR: Record<string, string> = {
  valid: 'bg-green-100 text-green-800',
  expiring_soon: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-red-100 text-red-800',
}

export default async function TrainingsPage() {
  const records = await listTrainingStatus()
  const expired = records.filter((record: any) => record.status === 'expired').length
  const expiringSoon = records.filter((record: any) => record.status === 'expiring_soon').length
  const valid = records.filter((record: any) => record.status === 'valid').length

  return (
    <section>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Treinamentos</h1>
          <p className="mt-1 text-sm text-brand-900/70">Acompanhe certificações, validade e necessidades de reciclagem.</p>
        </div>
        <TrainingForm />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-brand-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-brand-700/70">Certificações</p>
          <p className="mt-2 text-2xl font-semibold">{records.length}</p>
        </div>
        <div className="rounded-lg border border-brand-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-brand-700/70">Válidas</p>
          <p className="mt-2 text-2xl font-semibold text-green-700">{valid}</p>
        </div>
        <div className="rounded-lg border border-brand-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-brand-700/70">Vencem em breve</p>
          <p className="mt-2 text-2xl font-semibold text-yellow-700">{expiringSoon}</p>
        </div>
        <div className="rounded-lg border border-brand-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-brand-700/70">Vencidas</p>
          <p className="mt-2 text-2xl font-semibold text-red-700">{expired}</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-brand-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-left text-xs uppercase text-brand-700/70">
            <tr>
              <th className="px-4 py-3">Certificação</th>
              <th className="px-4 py-3">Treinamento</th>
              <th className="px-4 py-3">Emissão</th>
              <th className="px-4 py-3">Validade</th>
              <th className="px-4 py-3">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {records.map((record: any) => (
              <tr key={record.id}>
                <td className="px-4 py-3 font-medium">{record.certification?.name ?? '—'}</td>
                <td className="px-4 py-3">{record.training?.name ?? '—'}</td>
                <td className="px-4 py-3">{record.issued_at ?? '—'}</td>
                <td className="px-4 py-3">{record.expires_at ?? 'Sem vencimento'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLOR[record.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[record.status] ?? record.status}
                  </span>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-brand-700/60">
                  Nenhuma certificação cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
