export type EquipmentStatus = 'active' | 'quarantine' | 'blocked' | 'retired' | 'lost'
export type EquipmentOwnerType = 'fp' | 'client'

export interface Equipment {
  id: string
  tenant_id: string
  category_id: string | null
  manufacturer_id: string | null
  owner_type: EquipmentOwnerType
  client_id: string | null
  service_id: string | null
  cost_center_id: string | null
  location_id: string | null
  internal_code: string | null
  serial_number: string | null
  model: string
  manufacture_date: string | null
  acquisition_date: string | null
  first_use_date: string | null
  lifespan_months: number | null
  expiration_date: string | null
  certification: string | null
  ca_number: string | null
  status: EquipmentStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface EquipmentInput {
  category_id?: string
  manufacturer_id?: string
  owner_type?: EquipmentOwnerType
  client_id?: string
  service_id?: string
  cost_center_id?: string
  location_id?: string
  internal_code?: string
  serial_number?: string
  model: string
  manufacture_date?: string
  acquisition_date?: string
  first_use_date?: string
  lifespan_months?: number
  certification?: string
  ca_number?: string
  notes?: string
}
