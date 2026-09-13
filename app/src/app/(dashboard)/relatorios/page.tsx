import { getDashboardSummary } from '@/modules/bi/service'

function formatValue(value: string | number | undefined, suffix = '') {
  if (value === undefined || value === null || value === '') return '0'
  const amount = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(amount)) return value.toString()
  return `${amount.toLocaleString('pt-BR')}${suffix}`
}

function StatCard({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-xl border border-brand-100 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-brand-700/60">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${tone ?? 'text-brand-900'}`}>{value}</p>
    </div>
  )
}

export default async function ReportsPage() {
  const summary = await getDashboardSummary()

  const equipment = summary.equipment as any
  const compliance = summary.compliance as any
  const training = summary.training as any
  const operations = summary.operations as any
  const executive = summary.executive as any
  const results = summary.results as any
  const equipmentByCategory = summary.equipment_by_category ?? []
  const equipmentByManufacturer = summary.equipment_by_manufacturer ?? []
  const clientRisk = summary.client_risk ?? []
  const productivity = summary.productivity ?? []
  const auditEvents = summary.audit_events ?? []
  const topRejectedEquipment = summary.top_rejected_equipment ?? []
  const quarantine = summary.quarantine ?? {}
  const maintenance = summary.maintenance ?? {}
  const disposal = summary.disposal ?? {}
  const inspections = summary.inspections ?? {}
  const recentExpired = summary.expired_rows ?? []

  const cards = [
    ['FP Index', `${executive?.fp_index ?? 0}%`, 'text-brand-700'],
    ['Saúde do inventário', `${executive?.inventory_health_score ?? 0}%`, 'text-emerald-700'],
    ['Conformidade', `${compliance?.compliance_percent ?? 0}%`, 'text-brand-700'],
    ['Inspeções no período', inspections?.current_year ?? 0, 'text-sky-700'],
    ['Equipamentos ativos', equipment?.total_active ?? 0, 'text-brand-900'],
    ['Em quarentena', equipment?.total_quarantine ?? 0, 'text-amber-700'],
    ['Treinamentos válidos', training?.valid_count ?? 0, 'text-emerald-700'],
    ['Clientes sob gestão', operations?.total_clients ?? 0, 'text-brand-900'],
  ]

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-brand-700/70">Centro de inteligência executiva</p>
          <h1 className="mt-2 text-2xl font-semibold text-brand-900">Relatórios e BI</h1>
          <p className="mt-1 text-sm text-brand-900/70">
            Indicadores operacionais, de conformidade e risco consolidados em um painel executivo único.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/bi/export?format=csv"
            className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm font-medium text-brand-700 transition hover:border-brand-300 hover:bg-brand-50"
          >
            Exportar CSV
          </a>
          <a
            href="/api/bi/export?format=json"
            className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-800"
          >
            Exportar JSON
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, tone]) => (
          <StatCard key={label} label={label} value={value} tone={tone as string | undefined} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-900">Resumo executivo</h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              {executive?.fp_index ?? 0}% de performance
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-brand-50 p-4">
                <p className="text-sm text-brand-700/70">Inventário total</p>
                <p className="mt-1 text-2xl font-semibold text-brand-900">{formatValue(equipment?.total_general)}</p>
              </div>
              <div className="rounded-lg bg-sky-50 p-4">
                <p className="text-sm text-sky-700/70">Operacionais</p>
                <p className="mt-1 text-2xl font-semibold text-sky-900">{formatValue(equipment?.total_operational)}</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-4">
                <p className="text-sm text-amber-700/70">Atenção</p>
                <p className="mt-1 text-2xl font-semibold text-amber-900">{formatValue(equipment?.total_expiring_soon)}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-brand-100 bg-brand-50/40 p-4">
                <h3 className="text-sm font-medium text-brand-900">Saúde da operação</h3>
                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-brand-900/70">Bloqueados</span>
                    <strong className="text-red-700">{formatValue(equipment?.total_blocked)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-900/70">Vencidos</span>
                    <strong className="text-red-700">{formatValue(equipment?.total_expired)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-900/70">Em quarentena</span>
                    <strong className="text-amber-700">{formatValue(equipment?.total_quarantine)}</strong>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-brand-100 bg-brand-50/40 p-4">
                <h3 className="text-sm font-medium text-brand-900">Conformidade e inspeções</h3>
                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-brand-900/70">Aptos</span>
                    <strong className="text-emerald-700">{formatValue(results?.apto)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-900/70">AV</span>
                    <strong className="text-brand-700">{formatValue(results?.av)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-900/70">Reprovados</span>
                    <strong className="text-red-700">{formatValue(results?.reprovado)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-900">Status operacional</h2>
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-brand-50 p-3">
              <span className="text-brand-900/70">Clientes sob gestão</span>
              <strong>{formatValue(operations?.total_clients)}</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-brand-50 p-3">
              <span className="text-brand-900/70">Contratos ativos</span>
              <strong>{formatValue(operations?.active_contracts)}</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-brand-50 p-3">
              <span className="text-brand-900/70">Equipamentos gerenciados</span>
              <strong>{formatValue(operations?.equipment_under_management)}</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-brand-50 p-3">
              <span className="text-brand-900/70">Treinamentos em atraso</span>
              <strong className="text-red-700">{formatValue(training?.expired_count)}</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-brand-50 p-3">
              <span className="text-brand-900/70">Manutenções concluídas</span>
              <strong className="text-emerald-700">{formatValue(maintenance?.recovered)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-900">Distribuição por categoria</h2>
          <div className="mt-4 space-y-3">
            {equipmentByCategory.length ? (
              equipmentByCategory.map((item: any) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-brand-900/70">{item.name}</span>
                    <strong>{formatValue(item.count)}</strong>
                  </div>
                  <div className="h-2 rounded-full bg-brand-100">
                    <div
                      className="h-2 rounded-full bg-brand-700"
                      style={{ width: `${Math.min(100, (item.count / Math.max(1, equipmentByCategory[0]?.count ?? 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-brand-900/60">Sem dados de categoria disponíveis.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-900">Principais fabricantes</h2>
          <div className="mt-4 space-y-3">
            {equipmentByManufacturer.length ? (
              equipmentByManufacturer.map((item: any) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg bg-brand-50 p-3 text-sm">
                  <span className="text-brand-900/70">{item.name}</span>
                  <strong>{formatValue(item.count)}</strong>
                </div>
              ))
            ) : (
              <p className="text-sm text-brand-900/60">Sem dados de fabricantes disponíveis.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-900">Risco por cliente</h2>
          <div className="mt-4 space-y-3">
            {clientRisk.length ? (
              clientRisk.slice(0, 5).map((item: any) => (
                <div key={item.name} className="rounded-lg border border-brand-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-brand-900">{item.name}</span>
                    <span className="text-xs uppercase tracking-wide text-brand-700/60">Score {formatValue(item.score)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-brand-900/70">
                    <span>Equipamentos: {formatValue(item.equipment_count)}</span>
                    <span>Vencidos: {formatValue(item.expired)}</span>
                    <span>Reprovados: {formatValue(item.rejected)}</span>
                    <span>Quarentena: {formatValue(item.quarantine)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-brand-900/60">Sem risco por cliente para exibir.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-900">Top equipamentos com reprovação</h2>
          <div className="mt-4 space-y-3">
            {topRejectedEquipment.length ? (
              topRejectedEquipment.map((item: any) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm">
                  <span className="text-red-900/80">{item.name}</span>
                  <strong className="text-red-700">{formatValue(item.count)}x</strong>
                </div>
              ))
            ) : (
              <p className="text-sm text-brand-900/60">Nenhuma ocorrência de reprovação registrada.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-900">Quarentena e descarte</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3">
              <span className="text-amber-900/70">Casos em quarentena</span>
              <strong className="text-amber-700">{formatValue(quarantine?.current_count)}</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-red-50 p-3">
              <span className="text-red-900/70">Total descartados</span>
              <strong className="text-red-700">{formatValue(disposal?.total)}</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
              <span className="text-emerald-900/70">Taxa de recuperação</span>
              <strong className="text-emerald-700">{formatValue(maintenance?.recovery_rate)}%</strong>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-900">Produtividade por mês</h2>
          <div className="mt-4 space-y-3">
            {productivity.length ? (
              productivity.map((item: any) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg bg-brand-50 p-3 text-sm">
                  <span className="text-brand-900/70">{item.label}</span>
                  <strong>{formatValue(item.count)}</strong>
                </div>
              ))
            ) : (
              <p className="text-sm text-brand-900/60">Sem série de produtividade disponível.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-900">Eventos recentes de auditoria</h2>
          <div className="mt-4 space-y-3">
            {auditEvents.length ? (
              auditEvents.slice(0, 6).map((item: any) => (
                <div key={item.id} className="rounded-lg border border-brand-100 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-brand-900">{item.action}</span>
                    <span className="text-brand-700/60">{new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <p className="mt-1 text-brand-900/70">{item.entity}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-brand-900/60">Nenhum evento recente para exibir.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-900">Itens vencidos</h2>
          <div className="mt-4 space-y-3">
            {recentExpired.length ? (
              recentExpired.slice(0, 6).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm">
                  <span className="text-red-900/80">{item.model || `Equipamento ${item.id}`}</span>
                  <strong className="text-red-700">{new Date(item.expiration_date).toLocaleDateString('pt-BR')}</strong>
                </div>
              ))
            ) : (
              <p className="text-sm text-brand-900/60">Nenhum item vencido registrado.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
