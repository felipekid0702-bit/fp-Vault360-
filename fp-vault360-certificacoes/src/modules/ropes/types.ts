export interface RopeDetails {
  equipment_id: string
  tenant_id: string
  original_length_m: number
  current_length_m: number
  wear_percent: number
  retired: boolean
  retired_at: string | null
  retired_reason: string | null
}

export interface RopeCut {
  id: string
  equipment_id: string
  cut_length_m: number
  reason: string | null
  performed_at: string
}

export interface RopeUsageEvent {
  id: string
  equipment_id: string
  event_type: 'use' | 'inspection' | 'cut' | 'retirement'
  description: string | null
  occurred_at: string
}

export interface RegisterRopeCutInput {
  equipment_id: string
  cut_length_m: number
  reason?: string
}

export interface RetireRopeInput {
  equipment_id: string
  reason: string
}
