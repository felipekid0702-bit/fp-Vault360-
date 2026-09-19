import Link from 'next/link'
import Image from 'next/image'
import LogoutButton from './LogoutButton'
import { SidebarNav } from './SidebarNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-brand-100 bg-white px-4 py-6">
        <Image src="/brand/FP%20Vault360%20Final.png" alt="FP Vault360°" width={140} height={50} className="h-auto" />
        <SidebarNav />
        <LogoutButton />
        <div className="mt-6 border-t border-brand-100 pt-4 text-center">
          <p className="text-[10px] text-brand-900/45">Desenvolvido por Luiz Felipe Ferreira em 09/2026</p>
          <Image src="/brand/mate-masie.svg" alt="Mate Masie" width={42} height={42} className="mx-auto mt-3 h-10 w-10 object-contain" />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
