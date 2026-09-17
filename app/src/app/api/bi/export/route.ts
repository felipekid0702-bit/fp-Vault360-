import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import PDFDocument from 'pdfkit'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { requirePermission } from '@/shared/lib/supabase/authorization'

export const runtime = 'nodejs'

function csv(rows: Record<string, unknown>[]) {
  const columns = Object.keys(rows[0] ?? { registro: '' })
  return [columns.join(';'), ...rows.map((row) => columns.map((column) => JSON.stringify(row[column] ?? '')).join(';'))].join('\n')
}

function pdf(rows: Record<string, unknown>[]) {
  return new Promise<Buffer>((resolve, reject) => {
    const document = new PDFDocument({ margin: 40 })
    const chunks: Buffer[] = []
    document.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    document.on('end', () => resolve(Buffer.concat(chunks)))
    document.on('error', reject)
    document.fontSize(16).text('FP Vault360° - Relatório')
    document.moveDown()
    rows.forEach((row) => document.fontSize(9).text(Object.entries(row).map(([key, value]) => `${key}: ${value ?? '—'}`).join(' | ')) .moveDown(0.3))
    document.end()
  })
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    await requirePermission(supabase, 'bi:export')
    const params = new URL(request.url).searchParams
    let query = supabase.from('equipment').select('model, serial_number, invoice_number, acquisition_date, first_use_date, status, category_id, manufacturer_id, client_id, service_id, category:equipment_categories(name), manufacturer:manufacturers(name), client:clients(name), service:services(name, work_order)').is('deleted_at', null).order('created_at', { ascending: false }).limit(5000)
    if (params.get('from')) query = query.gte('created_at', params.get('from') as string)
    if (params.get('to')) query = query.lte('created_at', `${params.get('to')}T23:59:59.999Z`)
    if (params.get('client_id')) query = query.eq('client_id', params.get('client_id') as string)
    if (params.get('manufacturer_id')) query = query.eq('manufacturer_id', params.get('manufacturer_id') as string)
    if (params.get('category_id')) query = query.eq('category_id', params.get('category_id') as string)
    if (params.get('service_id')) query = query.eq('service_id', params.get('service_id') as string)
    const { data, error } = await query
    if (error) throw error
    const rows = (data ?? []).map((item: any) => ({ Modelo: item.model, 'Nº Série': item.serial_number, 'Nota Fiscal': item.invoice_number, 'Data da Compra': item.acquisition_date, 'Primeira Utilização': item.first_use_date, Status: item.status, Categoria: item.category?.name, Fabricante: item.manufacturer?.name, Cliente: item.client?.name }))
    const format = params.get('format') ?? 'csv'
    if (format === 'xlsx' || format === 'excel') {
      const sheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, sheet, 'Relatório')
      return new NextResponse(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }), { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="relatorio-fpvault360.xlsx"' } })
    }
    if (format === 'pdf') return new NextResponse(new Uint8Array(await pdf(rows)), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="relatorio-fpvault360.pdf"' } })
    return new NextResponse(csv(rows), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="relatorio-fpvault360.csv"' } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}