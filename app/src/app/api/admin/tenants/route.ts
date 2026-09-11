import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

const schema = z.object({
  name: z.string().min(1),
  legal_name: z.string().optional(),
  cnpj: z.string().optional(),
  operation_mode: z.enum(['service_provider', 'autonomous', 'hybrid']),
  admin_user_id: z.string().uuid(),
  admin_name: z.string().min(1),
  admin_email: z.string().email(),
})

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.rpc('provision_new_tenant', {
      p_name: parsed.data.name,
      p_legal_name: parsed.data.legal_name,
      p_cnpj: parsed.data.cnpj,
      p_operation_mode: parsed.data.operation_mode,
      p_admin_user_id: parsed.data.admin_user_id,
      p_admin_name: parsed.data.admin_name,
      p_admin_email: parsed.data.admin_email,
    })
    if (error) throw error
    return NextResponse.json({ data: { tenant_id: data } }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}