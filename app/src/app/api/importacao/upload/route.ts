import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/shared/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 422 })
    const extension = file.name.toLowerCase().split('.').pop()
    if (!['xlsx', 'xls', 'csv'].includes(extension ?? '')) return NextResponse.json({ error: 'Formato não suportado' }, { status: 422 })

    const supabase = createServerSupabaseClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 })
    const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', auth.user.id).single()
    if (!profile?.tenant_id) return NextResponse.json({ error: 'Usuário sem tenant' }, { status: 403 })

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${profile.tenant_id}/imports/${crypto.randomUUID()}-${safeName}`
    const storage = createServiceRoleClient().storage
    const { data: bucket } = await storage.getBucket('documents')
    if (!bucket) {
      const { error: bucketError } = await storage.createBucket('documents', { public: false })
      if (bucketError && !bucketError.message.toLowerCase().includes('already exists')) return NextResponse.json({ error: bucketError.message }, { status: 400 })
    }
    const { error } = await storage.from('documents').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type || 'application/octet-stream', upsert: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data: { path, name: file.name } }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
