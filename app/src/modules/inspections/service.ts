import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { getAuthenticatedTenant } from '@/shared/lib/supabase/tenant'
import type { CreateInspectionInput, Inspection } from './types'

export async function listInspections(filters?: { equipmentId?: string; result?: string; page?: number; pageSize?: number }) {
  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('inspections')
    .select('*, equipment(model, serial_number), inspector:users!inspections_inspector_id_fkey(full_name)')
    .is('deleted_at', null)
    .order('performed_at', { ascending: false })

  if (filters?.equipmentId) query = query.eq('equipment_id', filters.equipmentId)
  if (filters?.result) query = query.eq('result', filters.result)
  const page = Math.max(1, filters?.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, filters?.pageSize ?? 50))
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getChecklistTemplate(templateId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('checklist_templates')
    .select('*, items:checklist_items(id, label, description, order_index, is_critical, section, required, evidence_required)')
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
    .select('id, template_code, name, inspection_type')
    .eq('category_id', categoryId)
    .eq('active', true)
  if (error) throw error
  return data
}

export async function listInspectionTargets() {
  const supabase = createServerSupabaseClient()
  const [equipmentResult, templatesResult] = await Promise.all([
    supabase.from('equipment').select('id, model, serial_number, category_id, owner_type, client:clients(id, name), manufacturer:manufacturers(name), category:equipment_categories(name)').is('deleted_at', null).order('model'),
    supabase.from('checklist_templates')    .select('id, template_code, name, inspection_type, category_id').eq('active', true).order('name'),
  ])
  let equipment = equipmentResult.data
  if (equipmentResult.error?.code === 'PGRST200' || equipmentResult.error?.code === 'PGRST205') {
    console.error('[FP Vault360] Migration 014 ainda não aplicada; listando alvos de inspeção legados.', equipmentResult.error)
    const legacyResult = await supabase
      .from('equipment')
      .select('id, model, serial_number, category_id, manufacturer:manufacturers(name), category:equipment_categories(name)')
      .is('deleted_at', null)
      .order('model')
    if (legacyResult.error) throw legacyResult.error
    equipment = legacyResult.data?.map((item) => ({ ...item, owner_type: 'fp', client: [] })) ?? []
  } else if (equipmentResult.error) {
    throw equipmentResult.error
  }
  if (templatesResult.error) throw templatesResult.error
  return { equipment: equipment ?? [], templates: templatesResult.data ?? [] }
}

/**
 * Cria a inspeção, grava o resultado item a item e, se necessário, define o
 * resultado geral. A reprovação automática por item crítico é aplicada pelo
 * trigger `fn_apply_inspection_result()` no banco — este serviço não precisa
 * duplicar essa regra, apenas grava os itens e deixa o Postgres decidir.
 */
export async function createInspection(input: CreateInspectionInput) {
  const supabase = createServerSupabaseClient()
  const { user, tenantId } = await getAuthenticatedTenant(supabase)

  const { data: inspection, error: inspError } = await supabase
    .from('inspections')
    .insert({
      tenant_id: tenantId,
      equipment_id: input.equipment_id,
      kit_id: input.kit_id ?? null,
      template_id: input.template_id,
      type: input.type,
      inspector_id: user.id,
      notes: input.notes,
      history_notes: input.history_notes,
      inspection_location: input.inspection_location,
      history_fall: input.history_fall ?? false,
      history_chemical_or_abrasive: input.history_chemical_or_abrasive ?? false,
      history_temperature_out_of_range: input.history_temperature_out_of_range ?? false,
      history_unauthorized_modification: input.history_unauthorized_modification ?? false,
      verdict: input.verdict,
      next_due_date: input.next_due_date,
      result: input.overall_result ?? 'approved', // trigger sobrescreve para 'rejected' se houver item crítico NOK
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single()

  if (inspError) throw inspError

  const itemsPayload = input.items.map((item) => ({
    inspection_id: inspection.id,
    checklist_item_id: item.checklist_item_id,
    status: item.classification === 'AR' || item.classification === 'R' ? 'nok' : item.status,
    classification: item.classification,
    action_required: item.action_required ?? null,
    observation: item.observation ?? null,
  }))

  const { error: itemsError } = await supabase.from('inspection_items_result').insert(itemsPayload)
  if (itemsError) throw itemsError

  const hasRejectedItem = input.items.some((item) => item.classification === 'AR' || item.classification === 'R')
  const equipmentStatus = hasRejectedItem || input.verdict === 'unfit' ? 'quarantine' : 'active'
  const { error: equipmentStatusError } = await supabase
    .from('equipment')
    .update({ status: equipmentStatus, updated_by: user.id })
    .eq('id', input.equipment_id)
    .eq('tenant_id', tenantId)
  if (equipmentStatusError) throw equipmentStatusError

  if (input.evidence_paths?.length) {
    const { error: evidenceError } = await supabase.from('inspection_evidences').insert(
      input.evidence_paths.map((storage_path) => ({ inspection_id: inspection.id, storage_path })),
    )
    if (evidenceError) throw evidenceError
  }
  if (input.signature_image_path) {
    const { error: signatureError } = await supabase.from('inspection_signatures').insert({
      inspection_id: inspection.id,
      signer_user_id: user.id,
      signature_image_path: input.signature_image_path,
    })
    if (signatureError) throw signatureError
  }

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

  const { data: savedInspection, error: savedInspectionError } = await supabase
    .from('inspections')
    .select('*')
    .eq('id', inspection.id)
    .single()
  if (savedInspectionError) throw savedInspectionError
  return savedInspection as Inspection
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
  const { user } = await getAuthenticatedTenant(supabase)
  const { error } = await supabase
    .from('inspection_signatures')
    .insert({ inspection_id: inspectionId, signer_user_id: user.id, signature_image_path: signatureImagePath })
  if (error) throw error
}
