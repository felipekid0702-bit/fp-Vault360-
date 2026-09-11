import type { Metadata } from 'next'
import { AppWatermark } from '@/shared/components/AppWatermark'
import './globals.css'

export const metadata: Metadata = {
  title: 'FP Vault360°',
  description: 'Gestão e Inspeção Integrada de Equipamentos — F P Soluções em Altura',
  manifest: '/manifest.json',
  icons: { icon: '/brand/fp-vault360-logo.svg', apple: '/brand/fp-vault360-logo.svg' },
}

export const viewport = {
  themeColor: '#4F7A5C',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-brand-50 text-brand-900 antialiased">
        {children}
        <AppWatermark />
      </body>
    </html>
  )
}
