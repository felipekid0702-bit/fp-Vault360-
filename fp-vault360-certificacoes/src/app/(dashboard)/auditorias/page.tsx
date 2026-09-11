import { listAudits } from '@/modules/audit/service'
import { AuditForm } from '@/modules/audit/components/AuditForm'

export default async function AuditsPage() {
  const audits = await listAudits()
  const inProgress = audits.filter((audit: any) => audit.status === 'in_progress').length
  const completed = audits.filter((audit: any) => audit.status === 'completed').length

  return (
    <section>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Auditorias</h1>
          <p className="mt-1 text-sm text-brand-900/70">Acompanhe auditorias, escopo e responsável pela execução.</p>
        </div>
        <AuditForm />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-brand-100 bg-white p-4"><p className="text-xs uppercase tracking-wide text-brand-700/70">Total</p><p className="mt-2 text-2xl font-semibold">{audits.length}</p></div>
        <div className="rounded-lg border border-brand-100 bg-white p-4"><p className="text-xs uppercase tracking-wide text-brand-700/70">Em andamento</p><p className="mt-2 text-2xl font-semibold text-yellow-700">{inProgress}</p></div>
        <div className="rounded-lg border border-brand-100 bg-white p-4"><p className="text-xs uppercase tracking-wide text-brand-700/70">Concluídas</p><p className="mt-2 text-2xl font-semibold text-green-700">{completed}</p></div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-brand-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-left text-xs uppercase text-brand-700/70"><tr><th className="px-4 py-3">Auditoria</th><th className="px-4 py-3">Escopo</th><th className="px-4 py-3">Auditor</th><th className="px-4 py-3">Início</th><th className="px-4 py-3">Status</th></tr></thead>
          <tbody className="divide-y divide-brand-50">
            {audits.map((audit: any) => <tr key={audit.id}><td className="px-4 py-3 font-medium">{audit.title}</td><td className="px-4 py-3">{audit.scope ?? '—'}</td><td className="px-4 py-3">{audit.auditor?.full_name ?? '—'}</td><td className="px-4 py-3">{audit.started_at}</td><td className="px-4 py-3">{audit.status === 'completed' ? 'Concluída' : audit.status === 'cancelled' ? 'Cancelada' : 'Em andamento'}</td></tr>)}
            {!audits.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-brand-700/60">Nenhuma auditoria registrada ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}
