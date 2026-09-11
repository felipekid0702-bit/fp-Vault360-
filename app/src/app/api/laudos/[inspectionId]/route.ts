import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createHash } from 'node:crypto'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { requirePermission } from '@/shared/lib/supabase/authorization'

function createPdf(data: any, reportNumber: string, images: Array<{ path: string; buffer: Buffer }>) {
  return new Promise<Buffer>((resolve, reject) => {
    const document = new PDFDocument({ margin: 42, size: 'A4' })
    const chunks: Buffer[] = []
    document.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    document.on('end', () => resolve(Buffer.concat(chunks)))
    document.on('error', reject)

    const write = (text: string, options?: { bold?: boolean; size?: number }) => {
      document.font(options?.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(options?.size ?? 9).text(text)
    }
    write('FP Vault360° - LAUDO OFICIAL DE INSPEÇÃO', { bold: true, size: 16 })
    document.moveDown(0.5)
    write(`Laudo: ${reportNumber}`)
    write(`Ficha: ${data.checklist_templates?.template_code ?? ''} - ${data.checklist_templates?.name ?? ''}`)
    write(`Equipamento: ${data.equipment?.model ?? ''} | Série: ${data.equipment?.serial_number ?? 'não informado'} | Código: ${data.equipment?.internal_code ?? 'não informado'}`)
    write(`Inspetor: ${data.inspector?.full_name ?? ''} | Data: ${data.performed_at ?? ''} | Local: ${data.inspection_location ?? ''}`)
    document.moveDown(0.5)
    write(`RESULTADO: ${data.verdict === 'fit' ? 'APTO' : 'INAPTO'} (${data.result ?? 'pendente'})`, { bold: true, size: 13 })
    write(`Próximo controle: ${data.next_due_date ?? 'não informado'}`)
    document.moveDown(0.5)
    write('Itens avaliados', { bold: true, size: 11 })
    for (const item of data.items ?? []) {
      write(`${item.checklist_items?.section ?? 'Geral'} | ${item.checklist_items?.label ?? ''} | ${item.classification ?? item.status} | ${item.observation ?? 'sem observação'}${item.action_required ? ` | Ação: ${item.action_required}` : ''}`)
    }
    document.moveDown(0.5)
    write('Histórico e observações', { bold: true, size: 11 })
    write(data.history_notes ?? 'Sem histórico adicional informado.')
    write(data.notes ?? 'Sem observações gerais.')
    document.moveDown(0.5)
    write('Evidências fotográficas', { bold: true, size: 11 })
    for (const evidence of data.evidences ?? []) write(evidence.storage_path)
    for (const image of images) {
      try {
        document.addPage()
        write(`Evidência: ${image.path}`, { bold: true, size: 10 })
        document.image(image.buffer, { fit: [510, 680], align: 'center', valign: 'center' })
      } catch {
        write(`Não foi possível incorporar a imagem: ${image.path}`)
      }
    }
    document.addPage()
    write('Assinatura e responsabilidade', { bold: true, size: 11 })
    write('A decisão registrada neste laudo deve ser revisada pelo responsável competente conforme o procedimento FP aplicável.')
    for (const signature of data.signatures ?? []) write(`Assinatura registrada: ${signature.signature_image_path} em ${signature.signed_at}`)
    document.end()
  })
}

export async function GET(_request: Request, { params }: { params: { inspectionId: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { user, tenantId } = await requirePermission(supabase, 'inspections:approve')
    const { data, error } = await supabase
      .from('inspections')
      .select('*, equipment(model, serial_number, internal_code, manufacturer_id, invoice_number, acquisition_date, first_use_date), checklist_templates(template_code, name, objective), inspector:users!inspections_inspector_id_fkey(full_name), items:inspection_items_result(status, classification, observation, action_required, checklist_items(label, section)), evidences:inspection_evidences(storage_path, caption), signatures:inspection_signatures(signature_image_path, signed_at)')
      .eq('id', params.inspectionId)
      .eq('tenant_id', tenantId)
      .single()
    if (error) throw error
    const reportNumber = `FP-${String(data.id).slice(0, 8).toUpperCase()}`
    const { error: reportError } = await supabase.from('inspection_reports').upsert({
      tenant_id: data.tenant_id,
      inspection_id: data.id,
      report_number: reportNumber,
      generated_by: user.id,
    }, { onConflict: 'inspection_id' })
    if (reportError) throw reportError
    const images: Array<{ path: string; buffer: Buffer }> = []
    for (const evidence of [...(data.evidences ?? []), ...(data.signatures ?? []).map((signature: any) => ({ storage_path: signature.signature_image_path }))]) {
      if (!/\.(png|jpe?g)$/i.test(evidence.storage_path)) continue
      const { data: file } = await supabase.storage.from('documents').download(evidence.storage_path)
      if (file) images.push({ path: evidence.storage_path, buffer: Buffer.from(await file.arrayBuffer()) })
    }
    const pdf = await createPdf(data, reportNumber, images)
    const documentPath = `${data.tenant_id}/reports/${reportNumber}.pdf`
    const { error: uploadError } = await supabase.storage.from('documents').upload(documentPath, pdf, { contentType: 'application/pdf', upsert: true })
    if (uploadError) throw uploadError
    const documentHash = createHash('sha256').update(pdf).digest('hex')
    const { error: updateReportError } = await supabase.from('inspection_reports').update({ document_path: documentPath, document_hash: documentHash }).eq('inspection_id', data.id)
    if (updateReportError) throw updateReportError
    return new NextResponse(new Uint8Array(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${reportNumber}.pdf"` } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
}
