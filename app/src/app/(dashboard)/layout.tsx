import Link from 'next/link'
import Image from 'next/image'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/equipamentos', label: 'Equipamentos' },
  { href: '/clientes', label: 'Cadastros / Clientes' },
  { href: '/fabricantes', label: 'Cadastros / Fabricantes' },
  { href: '/categorias', label: 'Categorias' },
  { href: '/inspecoes', label: 'Inspeções' },
  { href: '/kits', label: 'Kits' },
  { href: '/treinamentos', label: 'Treinamentos' },
  { href: '/auditorias', label: 'Auditorias' },
  { href: '/servicos', label: 'Serviços' },
  { href: '/relatorios', label: 'Relatórios' },
  { href: '/importacao', label: 'Importação' },
  { href: '/configuracoes', label: 'Configurações' },
  { href: '/sobre', label: 'Sobre' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-brand-100 bg-white px-4 py-6">
        <Image src="/brand/fp-vault360-logo.svg" alt="FP Vault360°" width={140} height={50} className="h-auto" />
        <nav className="mt-8 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-bold text-brand-900/80 transition hover:bg-brand-50 hover:text-brand-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
