import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'

export async function GET() {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['Modelo', 'Categoria', 'Fabricante', 'Nº Série / Lote', 'Código interno', 'Nota Fiscal (NF)', 'Data da Compra', 'Data da Primeira Utilização', 'Status', 'Observações'],
    ['Exemplo Vertel', 'Cinto', 'Fabricante exemplo', 'LOTE-001', 'FP-001', 'NF-0001', '2026-01-15', '2026-02-01', 'active', 'Substitua esta linha pelos seus equipamentos'],
  ])
  worksheet['!cols'] = [{ wch: 28 }, { wch: 34 }, { wch: 28 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 28 }, { wch: 14 }, { wch: 48 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipamentos')
  const content = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="modelo-importacao-equipamentos.xlsx"',
      'Cache-Control': 'no-store',
    },
  })
}
