import { listContracts } from '@/modules/contracts/service'
import { ContractForm } from '@/modules/contracts/components/ContractForm'

export default async function ContractsPage() {
  const contracts = await listContracts()
  const active = contracts.filter((contract: any) => contract.status === 'active').length

  return (
    <section>
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">Contratos de inspeção</h1><p className="mt-1 text-sm text-brand-900/70">Escopos, SLA e frequência de inspeções por cliente.</p></div>
        <ContractForm />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-lg border border-brand-100 bg-white p-4"><p className="text-xs uppercase tracking-wide text-brand-700/70">Contratos cadastrados</p><p className="mt-2 text-2xl font-semibold">{contracts.length}</p></div><div className="rounded-lg border border-brand-100 bg-white p-4"><p className="text-xs uppercase tracking-wide text-brand-700/70">Ativos</p><p className="mt-2 text-2xl font-semibold text-green-700">{active}</p></div></div>
      <div className="mt-6 overflow-hidden rounded-lg border border-brand-100 bg-white"><table className="w-full text-sm"><thead className="bg-brand-50 text-left text-xs uppercase text-brand-700/70"><tr><th className="px-4 py-3">Contrato</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Início</th><th className="px-4 py-3">Fim</th><th className="px-4 py-3">Escopos</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-brand-50">{contracts.map((contract: any) => <tr key={contract.id}><td className="px-4 py-3 font-medium">{contract.contract_number ?? 'Sem número'}</td><td className="px-4 py-3">{contract.client?.name ?? '—'}</td><td className="px-4 py-3">{contract.start_date}</td><td className="px-4 py-3">{contract.end_date ?? 'Indeterminado'}</td><td className="px-4 py-3">{contract.scopes?.length ?? 0}</td><td className="px-4 py-3">{contract.status ?? '—'}</td></tr>)}{!contracts.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-brand-700/60">Nenhum contrato cadastrado ainda.</td></tr>}</tbody></table></div>
    </section>
  )
}
