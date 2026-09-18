import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'

export async function GET() {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['Equipamento', 'Usuário', 'Referência', 'Fabricante', 'Modelo', 'kit', 'Nº Individual', 'NF', '1ª Utiliz.', 'Data da Inspeção', 'Inspecionado por', 'próxima Insp.', 'Data da Compra', 'Local da Inspeção'],
    ['Exemplo Vertel', '', 'REF-001', 'Fabricante exemplo', 'Cinto', 'Não', 'LOTE-001', 'NF-0001', '01/02/2026', '15/01/2026', 'Nome do inspetor', '15/01/2027', '15/01/2026', 'FP Soluções'],
  ])
  worksheet['!cols'] = [28, 24, 18, 28, 28, 12, 20, 16, 16, 20, 24, 18, 18, 24].map((wch) => ({ wch }))
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
