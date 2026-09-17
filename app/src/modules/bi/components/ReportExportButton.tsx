'use client'

import { useState } from 'react'

export function ReportExportButton({ query = '' }: { query?: string }) {
  const [open, setOpen] = useState(false)
  return <div className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-medium text-white">Exportar Relatório</button>
    {open && <div role="dialog" className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-brand-200 bg-white p-3 shadow-lg"><p className="text-sm font-medium text-brand-900">Escolha o formato</p><div className="mt-3 grid gap-2">{[['csv', 'CSV'], ['xlsx', 'Excel'], ['pdf', 'PDF']].map(([format, label]) => <a key={format} href={`/api/bi/export?format=${format}${query}`} className="rounded border border-brand-100 px-3 py-2 text-sm text-brand-700 hover:bg-brand-50">{label}</a>)}</div></div>}
  </div>
}