import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import type { CreateInspectionInput, Inspection } from './types'

export async function listInspections(filters?: { equipmentId?: string; result?: string }) {
  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('inspections')
    .select('*, equipment(model, serial_number), inspector:users!inspections_inspector_id_fkey(full_name)')
    .is('deleted_at', null)
    .order('performed_at', { ascending: false })

  if (filters?.equipmentId) query = query.eq('equipment_id', filters.equipmentId)
  if (filters?.result) query = query.eq('result', filters.result)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getChecklistTemplate(templateId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('checklist_templates')
    .select('*, items:checklist_items(id, label, description, order_index, is_critical)')
    .eq('id', templateId)
    .order('order_index', { referencedTable: 'checklist_items', ascending: true })
    .single()
  if (error) throw error
  return data
}

export async function listTemplatesForCategory(categoryId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('checklist_templates')
    .select('id, name, inspection_type')
    .eq('category_id', categoryId)
    .eq('active', true)
  if (error) throw error
  return data
}

export async function listInspectionTargets() {
  const supabase = createServerSupabaseClient()
  const [equipmentResult, templatesResult] = await Promise.all([
    supabase.from('equipment').select('id, model, serial_number, category_id').is('deleted_at', null).order('model'),
    supabase.from('checklist_templates').select('id, name, inspection_type, category_id').eq('active', true).order('name'),
  ])
  if (equipmentResult.error) throw equipmentResult.error
  if (templatesResult.error) throw templatesResult.error
  return { equipment: equipmentResult.data ?? [], templates: templatesResult.data ?? [] }
}

/**
 * Cria a inspeção, grava o resultado item a item e, se necessário, define o
 * resultado geral. A reprovação automática por item crítico é aplicada pelo
 * trigger `fn_apply_inspection_result()` no banco — este serviço não precisa
 * duplicar essa regra, apenas grava os itens e deixa o Postgres decidir.
 */
export async function createInspection(input: CreateInspectionInput) {
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()

  const { data: inspection, error: inspError } = await supabase
    .from('inspections')
    .insert({
      equipment_id: input.equipment_id,
      kit_id: input.kit_id ?? null,
      template_id: input.template_id,
      type: input.type,
      inspector_id: auth.user?.id,
      notes: input.notes,
      next_due_date: input.next_due_date,
      result: input.overall_result ?? 'approved', // trigger sobrescreve para 'rejected' se houver item crítico NOK
      created_by: auth.user?.id,
      updated_by: auth.user?.id,
    })
    .select()
    .single()

  if (inspError) throw inspError

  const itemsPayload = input.items.map((item) => ({
    inspection_id: inspection.id,
    checklist_item_id: item.checklist_item_id,
    status: item.status,
    observation: item.observation ?? null,
  }))

  const { error: itemsError } = await supabase.from('inspection_items_result').insert(itemsPayload)
  if (itemsError) throw itemsError

  // Se a categoria do equipamento tinha status quarentena/bloqueado e a
  // inspeção foi aprovada, o gestor decide manualmente a reversão do status
  // do equipamento — não fazemos isso automaticamente para evitar liberar
  // equipamento sem revisão humana.

  await supabase.rpc('log_audit', {
    p_action: 'inspection_created',
    p_entity: 'inspections',
    p_entity_id: inspection.id,
    p_metadata: { type: input.type, equipment_id: input.equipment_id },
  })

  return inspection as Inspection
}

export async function uploadInspectionEvidence(inspectionId: string, storagePath: string, caption?: string) {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('inspection_evidences')
    .insert({ inspection_id: inspectionId, storage_path: storagePath, caption })
  if (error) throw error
}

export async function signInspection(inspectionId: string, signatureImagePath: string) {
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('inspection_signatures')
    .insert({ inspection_id: inspectionId, signer_user_id: auth.user?.id, signature_image_path: signatureImagePath })
  if (error) throw error
}
