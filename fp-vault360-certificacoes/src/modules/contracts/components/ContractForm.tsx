'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Tenant = { id: string; name: string; legal_name?: string | null }

export function ContractForm() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [clientTenantId, setClientTenantId] = useState('')
  const [contractNumber, setContractNumber] = useState('')
  const [scope, setScope] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isOpen || tenants.length) return
    fetch('/api/tenants').then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível carregar os clientes.')
      setTenants(result.data ?? [])
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os clientes.'))
  }, [isOpen, tenants.length])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      const response = await fetch('/api/contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_tenant_id: clientTenantId,
          contract_number: contractNumber || undefined,
          scope: scope || undefined,
          start_date: startDate,
          end_date: endDate || undefined,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message ?? result.error ?? 'Não foi possível criar o contrato.')
      setClientTenantId('')
      setContractNumber('')
      setScope('')
      setStartDate('')
      setEndDate('')
      setIsOpen(false)
      router.refresh()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Não foi possível criar o contrato.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen((current) => !current)} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
        {isOpen ? 'Fechar' : '+ Novo contrato'}
      </button>
      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-brand-100 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">Cliente<select required value={clientTenantId} onChange={(event) => setClientTenantId(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 bg-white px-3 py-2 font-normal"><option value="">Selecione um cliente</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}</select></label>
            <label className="text-sm font-medium">Número do contrato<input value={contractNumber} onChange={(event) => setContractNumber(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>
            <label className="text-sm font-medium">Escopo<input value={scope} onChange={(event) => setScope(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>
            <label className="text-sm font-medium">Início<input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>
            <label className="text-sm font-medium">Fim<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
          <div className="mt-4 flex justify-end"><button disabled={isSaving || !tenants.length} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{isSaving ? 'Salvando...' : 'Salvar contrato'}</button></div>
        </form>
      )}
    </>
  )
}