import { getDashboardSummary } from '@/modules/bi/service'

export default async function ReportsPage() {
  const summary = await getDashboardSummary()
  return <section><h1 className="text-2xl font-semibold">Relatórios e BI</h1><p className="mt-2 text-sm text-brand-900/70">Conformidade atual: {summary.compliance?.compliance_percent ?? 0}%.</p></section>
}
