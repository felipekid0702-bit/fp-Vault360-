import Image from 'next/image'
import { getPlatformIdentity, isCurrentUserSuperMaster } from '@/modules/platform/service'
import Link from 'next/link'

export default async function AboutPage() {
  const identity = await getPlatformIdentity()
  const isSuperMaster = await isCurrentUserSuperMaster()

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
      <Image src="/brand/fp-vault360-logo.svg" alt="FP Vault360°" width={220} height={80} />
      <h1 className="mt-6 text-2xl font-semibold">{identity.product_name}</h1>

      <dl className="mt-6 divide-y divide-brand-100 rounded-lg border border-brand-100 bg-white">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between px-4 py-3 text-sm">
            <dt className="text-brand-700/70">{row.label}</dt>
            <dd className="font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>

      {/* Link de edição de identidade só existe para o Super Master,
          e só neste ponto — não aparece em nenhum menu padrão. */}
      {isSuperMaster && (
        <Link
          href="/sobre/identidade"
          className="mt-4 inline-block text-xs text-brand-600 underline underline-offset-2"
        >
          Editar identidade da plataforma
        </Link>
      )}
    </div>
  )
}
