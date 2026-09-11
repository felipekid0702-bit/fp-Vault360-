'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Equipment } from '@/modules/equipment/types'

interface CatalogOption {
  id: string
  name: string
}

export function EquipmentForm({
  categories = [],
  manufacturers = [],
  clients = [],
  services = [],
  kits = [],
  equipment,
  onSaved,
}: {
  categories?: CatalogOption[]
  manufacturers?: CatalogOption[]
  clients?: CatalogOption[]
  services?: Array<{ id: string; name?: string; work_order?: string; client_id?: string }>
  kits?: Array<{ id: string; name: string }>
  equipment?: Pick<Equipment, 'id' | 'model' | 'category_id' | 'manufacturer_id' | 'serial_number' | 'internal_code' | 'acquisition_date' | 'lifespan_months' | 'owner_type' | 'client_id' | 'service_id'>
  onSaved?: () => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [model, setModel] = useState(equipment?.model ?? '')
  const [categoryId, setCategoryId] = useState(equipment?.category_id ?? '')
  const [manufacturerId, setManufacturerId] = useState(equipment?.manufacturer_id ?? '')
  const [ownerType, setOwnerType] = useState<'fp' | 'client'>(equipment?.owner_type ?? 'fp')
  const [clientId, setClientId] = useState(equipment?.client_id ?? '')
  const [serviceId, setServiceId] = useState(equipment?.service_id ?? '')
  const [kitId, setKitId] = useState('')
  const [serialNumber, setSerialNumber] = useState(equipment?.serial_number ?? '')
  const [internalCode, setInternalCode] = useState(equipment?.internal_code ?? '')
  const [acquisitionDate, setAcquisitionDate] = useState(equipment?.acquisition_date ?? '')
  const [lifespan, setLifespan] = useState(equipment?.lifespan_months?.toString() ?? '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const response = await fetch(equipment ? `/api/equipment/${equipment.id}` : '/api/equipment', {
        method: equipment ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          category_id: categoryId || undefined,
          manufacturer_id: manufacturerId || undefined,
          owner_type: ownerType,
          client_id: ownerType === 'client' ? clientId : undefined,
          service_id: ownerType === 'client' ? serviceId : undefined,
          serial_number: serialNumber || undefined,
          internal_code: internalCode || undefined,
          acquisition_date: acquisitionDate || undefined,
          lifespan_months: lifespan ? Number(lifespan) : undefined,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message ?? result.error ?? 'Não foi possível cadastrar o equipamento.')
      if (kitId) {
        const kitResponse = await fetch(`/api/kits/${kitId}/items`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ equipment_ids: [equipment?.id ?? result.data.id] }) })
        if (!kitResponse.ok) throw new Error('Equipamento salvo, mas não foi possível vinculá-lo ao kit.')
      }
      setSuccess(equipment ? 'Equipamento atualizado com sucesso.' : 'Equipamento cadastrado com sucesso.')
      if (!equipment) {
        setModel(''); setCategoryId(''); setManufacturerId(''); setOwnerType('fp'); setClientId(''); setServiceId(''); setKitId(''); setSerialNumber(''); setInternalCode(''); setAcquisitionDate(''); setLifespan('')
        setOpen(false)
      }
      onSaved?.()
      router.refresh()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Não foi possível cadastrar o equipamento.')
    } finally { setSaving(false) }
  }

  return <>
    <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">{open ? 'Fechar' : equipment ? 'Editar' : '+ Novo Equipamento'}</button>
    {open && <form onSubmit={submit} className="mt-6 rounded-lg border border-brand-100 bg-white p-5"><div className="grid gap-4 md:grid-cols-3">
      <label className="text-sm font-medium">Categoria<select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal"><option value="">Selecione</option>{categories.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
      <label className="text-sm font-medium">Modelo<input required value={model} onChange={(event) => setModel(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>
      <label className="text-sm font-medium">Fabricante<select value={manufacturerId} onChange={(event) => setManufacturerId(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal"><option value="">Não informado</option>{manufacturers.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
      <label className="text-sm font-medium">Proprietário<select value={ownerType} onChange={(event) => { setOwnerType(event.target.value as 'fp' | 'client'); if (event.target.value === 'fp') setClientId('') }} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal"><option value="fp">FP Soluções</option><option value="client">Cliente</option></select></label>
      {ownerType === 'client' && <label className="text-sm font-medium">Cliente<select required value={clientId} onChange={(event) => setClientId(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal"><option value="">Selecione</option>{clients.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>}
      {ownerType === 'client' && <label className="text-sm font-medium">Serviço <span className="font-normal text-brand-700/70">(pendente)</span><select value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal"><option value="">Ainda não vinculado</option>{services.filter((service) => !service.client_id || service.client_id === clientId).map((option) => <option key={option.id} value={option.id}>{option.name ?? option.work_order}</option>)}</select></label>}
      <label className="text-sm font-medium">Kit (opcional)<select value={kitId} onChange={(event) => setKitId(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal"><option value="">Não vinculado</option>{kits.map((kit) => <option key={kit.id} value={kit.id}>{kit.name}</option>)}</select></label>
      <label className="text-sm font-medium">Nº Série / Lote<input value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>
      <label className="text-sm font-medium">Código interno<input value={internalCode} onChange={(event) => setInternalCode(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>
      <label className="text-sm font-medium">Data de aquisição<input type="date" value={acquisitionDate} onChange={(event) => setAcquisitionDate(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>
      <label className="text-sm font-medium">Vida útil (meses)<input type="number" min="1" value={lifespan} onChange={(event) => setLifespan(event.target.value)} className="mt-1 block w-full rounded-md border border-brand-100 px-3 py-2 font-normal" /></label>
    </div>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}{success && <p role="status" className="mt-3 text-sm text-green-700">{success}</p>}<div className="mt-4 flex justify-end"><button disabled={saving} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Salvando...' : equipment ? 'Atualizar equipamento' : 'Salvar equipamento'}</button></div></form>}
  </>
}