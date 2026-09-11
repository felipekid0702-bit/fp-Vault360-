import { getDashboardSummary } from '@/modules/bi/service'

export default async function DashboardPage() {
  const summary = await getDashboardSummary()
  const equipment = summary.equipment as Record<string, number> | null
  const compliance = summary.compliance as Record<string, number> | null
  return (
    <section>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Equipamentos ativos" value={equipment?.total_active ?? 0} />
        <Metric label="Bloqueados" value={equipment?.total_blocked ?? 0} />
        <Metric label="Vencidos" value={equipment?.total_expired ?? 0} />
        <Metric label="Conformidade" value={`${compliance?.compliance_percent ?? 0}%`} />
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-brand-100 bg-white p-4"><p className="text-sm text-brand-900/70">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>
}
