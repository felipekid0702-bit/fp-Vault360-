'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function InspectionChangeDecision({ id }: { id: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function decide(action: 'approve' | 'reject') {
    const reason = action === 'reject' ? window.prompt('Informe o motivo da rejeição:') ?? '' : ''
    if (action === 'reject' && !reason.trim()) return
    setBusy(true)
    const response = await fetch(`/api/inspection-changes/${id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, reason }) })
    const body = await response.json()
    setBusy(false)
    if (!response.ok) { setMessage(body.error ?? 'Não foi possível concluir a decisão.'); return }
    setMessage(action === 'approve' ? 'Alteração aprovada.' : 'Alteração rejeitada e mantida no histórico.')
    router.refresh()
  }

  return <div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" disabled={busy} onClick={() => decide('approve')} className="rounded bg-green-700 px-3 py-1 text-xs font-medium text-white disabled:opacity-50">Aprovar</button><button type="button" disabled={busy} onClick={() => decide('reject')} className="rounded bg-red-700 px-3 py-1 text-xs font-medium text-white disabled:opacity-50">Rejeitar</button>{message && <span className="text-xs text-brand-700">{message}</span>}</div>
}