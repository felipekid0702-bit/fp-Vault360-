import { getDashboardSummary } from '@/modules/bi/service'

export default async function DashboardPage() {
  const summary = await getDashboardSummary()
  const equipment = summary.equipment as any
  const compliance = summary.compliance as any
  const executive = summary.executive as any

  const metrics = [
    ['Equipamentos ativos', equipment?.total_active ?? 0],
    ['Bloqueados', equipment?.total_blocked ?? 0],
    ['Vencidos', equipment?.total_expired ?? 0],
    ['Conformidade', `${compliance?.compliance_percent ?? 0}%`],
    ['FP Index', `${executive?.fp_index ?? 0}%`],
    ['Sa�de do invent�rio', `${executive?.inventory_health_score ?? 0}%`],
  ]

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">Dashboard</h1>
        <p className="mt-1 text-sm text-brand-900/70">Painel executivo com indicadores prim�rios do FP Vault360�.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-brand-100 bg-white p-4 shadow-sm">
            <p className="text-sm text-brand-900/70">{label}</p>
            <p className="mt-3 text-2xl font-semibold text-brand-900">{value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
