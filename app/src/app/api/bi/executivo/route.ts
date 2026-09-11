import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/shared/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from('v_fp_executive_summary').select('*').maybeSingle()
    if (error) throw error
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
