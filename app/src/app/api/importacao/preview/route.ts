import { NextRequest, NextResponse } from 'next/server'
import { previewSpreadsheet } from '@/modules/imports/preview'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'Envie um arquivo XLSX, XLS ou CSV' }, { status: 422 })
    const extension = file.name.toLowerCase().split('.').pop()
    if (!['xlsx', 'xls', 'csv'].includes(extension ?? '')) return NextResponse.json({ error: 'Formato não suportado' }, { status: 422 })
    const mappingValue = form.get('mapping')
    const mapping = mappingValue ? JSON.parse(String(mappingValue)) : {}
    const result = previewSpreadsheet(await file.arrayBuffer(), mapping)
    return NextResponse.json({ data: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Falha ao analisar planilha' }, { status: 400 })
  }
}
