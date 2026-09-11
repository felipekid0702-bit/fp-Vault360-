import { getDashboardSummary } from '@/modules/bi/service'

export default async function ReportsPage() {
  const summary = await getDashboardSummary()
  const equipment = summary.equipment as any
  const compliance = summary.compliance as any
  const training = summary.training as any
  const operations = summary.operations as any
  const cards = [
    ['Equipamentos ativos', equipment?.total_active ?? 0, 'Inventário'],
    ['Operacionais', equipment?.total_operational ?? 0, 'Inventário'],
    ['Em quarentena', equipment?.total_quarantine ?? 0, 'Atenção'],
    ['Vencidos', equipment?.total_expired ?? 0, 'Atenção'],
    ['Conformidade', `${compliance?.compliance_percent ?? 0}%`, 'Inspeções'],
    ['Inspeções realizadas', compliance?.total_inspections ?? 0, 'Inspeções'],
    ['Treinamentos vencidos', training?.expired_count ?? 0, 'Pessoas'],
    ['Contratos ativos', operations?.active_contracts ?? 0, 'Operação FP'],
  ]

  return <section><div className="flex items-center justify-between"><div><h1 className="text-xl font-semibold">Relatórios e BI</h1><p className="mt-1 text-sm text-brand-900/70">Indicadores executivos consolidados do FP Vault360°.</p></div><button className="rounded-md border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700">Exportar relatório</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value, group]) => <div key={label} className="rounded-lg border border-brand-100 bg-white p-4"><p className="text-xs uppercase tracking-wide text-brand-700/60">{group}</p><p className="mt-2 text-sm text-brand-900/70">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}</div><div className="mt-6 grid gap-4 lg:grid-cols-2"><div className="rounded-lg border border-brand-100 bg-white p-5"><h2 className="font-medium">Saúde do inventário</h2><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span>Bloqueados</span><strong className="text-red-700">{equipment?.total_blocked ?? 0}</strong></div><div className="flex justify-between"><span>Vencem em 30 dias</span><strong className="text-yellow-700">{equipment?.total_expiring_soon ?? 0}</strong></div><div className="flex justify-between"><span>Treinamentos a vencer</span><strong className="text-yellow-700">{training?.expiring_soon_count ?? 0}</strong></div></div></div><div className="rounded-lg border border-brand-100 bg-white p-5"><h2 className="font-medium">Operação prestador</h2><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span>Clientes sob gestão</span><strong>{operations?.total_clients ?? 0}</strong></div><div className="flex justify-between"><span>Equipamentos gerenciados</span><strong>{operations?.equipment_under_management ?? 0}</strong></div><div className="flex justify-between"><span>Inspeções reprovadas</span><strong className="text-red-700">{compliance?.rejected ?? 0}</strong></div></div></div></div></section>
}
