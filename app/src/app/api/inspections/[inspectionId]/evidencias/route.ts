import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'
import { getAuthenticatedTenant } from '@/shared/lib/supabase/tenant'

export async function POST(request: NextRequest, { params }: { params: { inspectionId: string } }) {
  try {
    const form = await request.formData()
    const file = form.get('file')
    const kind = form.get('kind') === 'signature' ? 'signature' : 'evidence'
    const checklistItemId = form.get('checklist_item_id')?.toString()
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: 'Arquivo obrigatório.' }, { status: 422 })
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Apenas imagens são aceitas.' }, { status: 422 })
    const supabase = createServerSupabaseClient()
    const { user, tenantId } = await getAuthenticatedTenant(supabase)
    const extension = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const path = `${tenantId}/inspections/${params.inspectionId}/${kind}-${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage.from('documents').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false })
    if (uploadError) throw uploadError
    if (kind === 'signature') {
      const { error } = await supabase.from('inspection_signatures').insert({ inspection_id: params.inspectionId, signer_user_id: user.id, signature_image_path: path })
      if (error) throw error
    } else {
      const { error } = await supabase.from('inspection_evidences').insert({ inspection_id: params.inspectionId, checklist_item_id: checklistItemId || null, storage_path: path, caption: form.get('caption')?.toString() || null })
      if (error) throw error
    }
    return NextResponse.json({ data: { path, kind } }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
