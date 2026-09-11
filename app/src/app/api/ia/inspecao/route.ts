import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  classifications: z.array(z.enum(['C', 'B', 'AV', 'AR', 'R'])),
  history_trigger: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  const { classifications, history_trigger } = parsed.data
  const recommendation = history_trigger || classifications.some((item) => ['AR', 'R'].includes(item))
    ? { result: 'INAPTO', action: 'Quarentena e avaliação competente; considerar reparo ou descarte.' }
    : classifications.includes('AV')
      ? { result: 'APTO_COM_RESTRICAO', action: 'Registrar restrição, ação de acompanhamento e próximo controle.' }
      : { result: 'APTO', action: 'Liberar conforme procedimento e periodicidade aplicável.' }
  return NextResponse.json({ data: { recommendation, disclaimer: 'Sugestão baseada nas regras FP; a decisão final é do responsável competente.' } })
}
