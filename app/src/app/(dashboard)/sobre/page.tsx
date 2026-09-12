import Image from 'next/image'
import { getPlatformIdentity } from '@/modules/platform/service'

export default async function AboutPage() {
  const identity = await getPlatformIdentity()

  const rows = [
    { label: 'Versão', value: identity.version },
    { label: 'Status', value: identity.status },
    { label: 'Empresa', value: identity.company_name },
    { label: 'Produto', value: identity.product_name },
    { label: 'Tipo', value: 'SaaS Multiempresa (Multi-Tenant)' },
    { label: 'Data Base', value: identity.base_date },
  ]

  return (
    <div className="mx-auto max-w-xl py-12">
      <Image src="/brand/FP%20Vault360%20Final.png" alt="FP Vault360°" width={220} height={80} />
      <h1 className="mt-6 text-2xl font-semibold">{identity.product_name}</h1>

      <dl className="mt-6 divide-y divide-brand-100 rounded-lg border border-brand-100 bg-white">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between px-4 py-3 text-sm">
            <dt className="text-brand-700/70">{row.label}</dt>
            <dd className="font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>

    </div>
  )
}
