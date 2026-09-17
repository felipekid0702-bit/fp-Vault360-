'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/equipamentos', label: 'Equipamentos' },
  { href: '/clientes', label: 'Cadastros / Clientes' },
  { href: '/fabricantes', label: 'Cadastros / Fabricantes' },
  { href: '/categorias', label: 'Categorias' },
  { href: '/inspecoes', label: 'Inspeções' },
  { href: '/kits', label: 'Kits' },
  { href: '/auditorias', label: 'Auditorias' },
  { href: '/servicos', label: 'Serviços' },
  { href: '/relatorios', label: 'Relatórios' },
  { href: '/importacao', label: 'Importação' },
  { href: '/configuracoes', label: 'Configurações' },
  { href: '/sobre', label: 'Sobre' },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="mt-8 space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`block rounded-md px-3 py-2 text-sm font-bold transition ${
              isActive
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-brand-900/80 hover:bg-brand-50 hover:text-brand-700'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}