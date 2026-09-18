import { createServerSupabaseClient, createServiceRoleClient } from '@/shared/lib/supabase/server'
import { parseSpreadsheet } from './preview'

const EQUIPMENT_STATUSES = new Set(['active', 'quarantine', 'blocked', 'retired', 'lost'])
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function asDate(value: unknown) {
  if (!value) return undefined
  const text = String(value).trim()
  const brazilianDate = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brazilianDate) return `${brazilianDate[3]}-${brazilianDate[2]}-${brazilianDate[1]}`
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString().slice(0, 10)
}

function asText(value: unknown) {
  return value === null || value === undefined ? undefined : String(value).trim() || undefined
}

export async function processImportJob(jobId: string) {
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sessão expirada')

  const { data: job, error: jobError } = await supabase.from('import_jobs').select('*').eq('id', jobId).single()
  if (jobError || !job) throw new Error(jobError?.message ?? 'Importação não encontrada')
  if (job.status === 'processing' || job.status === 'completed') throw new Error('Esta importação já foi processada')
  if (job.entity !== 'equipment') throw new Error('A importação definitiva de kits, usuários e treinamentos será habilitada no próximo worker')

  await supabase.from('import_jobs').update({ status: 'processing', started_at: new Date().toISOString() }).eq('id', jobId)
  const insertedIds: string[] = []
  const errors: Array<{ import_job_id: string; row_number: number; field?: string; message: string }> = []

  try {
    const { data: file, error: fileError } = await createServiceRoleClient().storage.from('documents').download(job.file_path)
    if (fileError || !file) throw new Error(fileError?.message ?? 'Arquivo de importação não encontrado no Storage')

    const parsed = parseSpreadsheet(await file.arrayBuffer())
    errors.push(...parsed.errors.map((error) => ({ ...error, import_job_id: jobId })))
    const seenSerials = new Set<string>()
    const validRows = parsed.rows.filter((row, index) => {
      const rowNumber = index + 2
      const serial = asText(row.serial_number)
      if (serial && seenSerials.has(serial.toLocaleLowerCase())) {
        errors.push({ import_job_id: jobId, row_number: rowNumber, field: 'serial_number', message: 'Número de série repetido na planilha' })
        return false
      }
      if (serial) seenSerials.add(serial.toLocaleLowerCase())
      return !parsed.errors.some((error) => error.row_number === rowNumber)
    })

    const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', auth.user.id).single()
    if (!profile?.tenant_id) throw new Error('Usuário não possui tenant para importar equipamentos')
    const { data: categories } = await supabase.from('equipment_categories').select('id, name').eq('tenant_id', profile.tenant_id).is('deleted_at', null)
    const categoryIds = new Map((categories ?? []).map((category) => [category.name.toLocaleLowerCase('pt-BR'), category.id]))
    const { data: manufacturers } = await supabase.from('manufacturers').select('id, name').eq('tenant_id', profile.tenant_id).is('deleted_at', null)
    const manufacturerIds = new Map((manufacturers ?? []).map((manufacturer) => [manufacturer.name.toLocaleLowerCase('pt-BR'), manufacturer.id]))

    for (let index = 0; index < validRows.length; index += 1) {
      const row = validRows[index]
      const status = asText(row.status)
      const payload = {
        tenant_id: profile.tenant_id,
        model: asText(row.model) as string,
        serial_number: asText(row.serial_number),
        internal_code: asText(row.internal_code),
        manufacturer_id: UUID_PATTERN.test(asText(row.manufacturer_id) ?? '') ? row.manufacturer_id : manufacturerIds.get(asText(row.manufacturer)?.toLocaleLowerCase('pt-BR') ?? ''),
        category_id: UUID_PATTERN.test(asText(row.category_id) ?? '') ? row.category_id : categoryIds.get(asText(row.category_name)?.toLocaleLowerCase('pt-BR') ?? ''),
        manufacture_date: asDate(row.manufacture_date),
        acquisition_date: asDate(row.acquisition_date),
        first_use_date: asDate(row.first_use_date),
        invoice_number: asText(row.invoice_number),
        status: status && EQUIPMENT_STATUSES.has(status) ? status : 'active',
        notes: asText(row.notes),
        created_by: auth.user.id,
        updated_by: auth.user.id,
      }
      const { data: equipment, error } = await supabase.from('equipment').insert(payload).select('id').single()
      if (error || !equipment) {
        errors.push({ import_job_id: jobId, row_number: index + 2, field: 'equipment', message: error?.message ?? 'Falha ao criar equipamento' })
        continue
      }
      insertedIds.push(equipment.id)
    }

    if (errors.length && insertedIds.length === 0) {
      await supabase.from('import_jobs').update({ status: 'failed', total_rows: parsed.rows.length, valid_rows: 0, error_rows: errors.length, finished_at: new Date().toISOString() }).eq('id', jobId)
    } else {
      await supabase.from('import_jobs').update({ status: 'completed', total_rows: parsed.rows.length, valid_rows: insertedIds.length, error_rows: errors.length, finished_at: new Date().toISOString() }).eq('id', jobId)
    }
    if (errors.length) await supabase.from('import_errors').insert(errors)
    return { jobId, inserted: insertedIds.length, errors: errors.length }
  } catch (error) {
    if (insertedIds.length) await supabase.from('equipment').delete().in('id', insertedIds)
    await supabase.from('import_jobs').update({ status: 'rolled_back', finished_at: new Date().toISOString() }).eq('id', jobId)
    throw error
  }
}
