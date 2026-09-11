import * as XLSX from 'xlsx'

const DEFAULT_FIELDS: Record<string, string> = {
  fabricante: 'manufacturer',
  manufacturer: 'manufacturer',
  modelo: 'model',
  model: 'model',
  'nº série': 'serial_number',
  'numero de serie': 'serial_number',
  'número de série': 'serial_number',
  serial_number: 'serial_number',
  'código interno': 'internal_code',
  'codigo interno': 'internal_code',
  internal_code: 'internal_code',
  categoria: 'category_name',
  'categoria do equipamento': 'category_name',
  category_name: 'category_name',
  category: 'category_id',
  status: 'status',
  observações: 'notes',
  observacoes: 'notes',
  notes: 'notes',
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR')
}

export function parseSpreadsheet(buffer: ArrayBuffer, mapping: Record<string, string> = {}) {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) throw new Error('A planilha não possui uma aba válida')

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
  const fields = { ...DEFAULT_FIELDS, ...Object.fromEntries(Object.entries(mapping).map(([key, value]) => [normalize(key), value])) }
  const errors: Array<{ row_number: number; field?: string; message: string }> = []
  const mappedRows = rows.map((row, index) => {
    const mapped = Object.fromEntries(Object.entries(row).map(([key, value]) => [fields[normalize(key)] ?? key, value]))
    if (!String(mapped.model ?? '').trim()) errors.push({ row_number: index + 2, field: 'model', message: 'Modelo é obrigatório' })
    return mapped
  })

  return { rows: mappedRows, errors, detectedMapping: Object.fromEntries(Object.keys(rows[0] ?? {}).map((key) => [key, fields[normalize(key)] ?? null])) }
}

export function previewSpreadsheet(buffer: ArrayBuffer, mapping: Record<string, string> = {}) {
  const parsed = parseSpreadsheet(buffer, mapping)
  return {
    totalRows: parsed.rows.length,
    validRows: parsed.rows.length - parsed.errors.length,
    errorRows: parsed.errors.length,
    errors: parsed.errors.slice(0, 200),
    rows: parsed.rows.slice(0, 100),
    detectedMapping: parsed.detectedMapping,
  }
}
