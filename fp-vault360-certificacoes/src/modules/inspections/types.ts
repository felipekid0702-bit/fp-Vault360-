export type InspectionType = 'acquisition' | 'pre_use' | 'periodic' | 'extraordinary' | 'post_fall'
export type InspectionResult = 'approved' | 'approved_with_restriction' | 'rejected'
export type ChecklistItemStatus = 'ok' | 'nok' | 'na'

export interface ChecklistTemplate {
  id: string
  tenant_id: string | null
  category_id: string | null
  name: string
  inspection_type: InspectionType
  active: boolean
}

export interface ChecklistItem {
  id: string
  template_id: string
  label: string
  description: string | null
  order_index: number
  is_critical: boolean
}

export interface Inspection {
  id: string
  tenant_id: string
  equipment_id: string
  kit_id: string | null
  template_id: string | null
  type: InspectionType
  inspector_id: string
  performed_at: string
  performed_by_org: 'fp' | 'client'
  result: InspectionResult | null
  notes: string | null
  next_due_date: string | null
  created_at: string
}

export interface InspectionItemResultInput {
  checklist_item_id: string
  status: ChecklistItemStatus
  observation?: string
}

export interface CreateInspectionInput {
  equipment_id: string
  kit_id?: string
  template_id: string
  type: InspectionType
  notes?: string
  next_due_date?: string
  items: InspectionItemResultInput[]
  overall_result?: InspectionResult // usado quando não há item crítico reprovando automaticamente
}
