import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

const schema = z.object({ current_password: z.string().min(1), new_password: z.string().min(8), confirmation: z.string().min(8) })

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Informe a senha atual e uma nova senha com pelo menos 8 caracteres.' }, { status: 422 })
  if (parsed.data.new_password !== parsed.data.confirmation) return NextResponse.json({ error: 'A confirmação da nova senha não confere.' }, { status: 422 })
  const supabase = createServerSupabaseClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user?.email) return NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 })
  const { error: verifyError } = await supabase.auth.signInWithPassword({ email: auth.user.email, password: parsed.data.current_password })
  if (verifyError) return NextResponse.json({ error: 'Senha atual inválida.' }, { status: 422 })
  const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.new_password })
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })
  const { error: profileError } = await supabase.from('users').update({ must_change_password: false, updated_by: auth.user.id }).eq('id', auth.user.id)
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
