# Templates digitais FP01–FP12

## Estrutura comum

```yaml
template:
  code: FPxx
  name: nome da ficha
  category: categoria
  objective: objetivo
  inspection_types: [acquisition, pre_use, periodic, extraordinary, post_event]
  identification:
    - internal_number
    - individual_number
    - reference
    - manufacturer
    - model
    - invoice
    - acquisition_date
    - first_use_date
  execution:
    - inspection_date
    - inspector
    - location
    - history
    - items
    - comments
    - verdict
    - next_control_date
    - signature
```

Cada `item` deve conter `section`, `label`, `required: true`, `classifications:
[C,B,AV,AR,R]`, `observation_required_on: [AV,AR,R]`, `critical: true|false` e
`evidence_required_on: [AR,R]`. O veredito final é APTO/INAPTO; o motor não deve
assumir que “OK” em todos os itens supera um gatilho histórico.

## FP01 — Ascensor

- Visual: corpo; batente anti-retorno; mordente e rebites; patilha, eixo e poliamida.
- Funcional: desliza para cima/bloqueia para baixo; mola do mordente; mola da patilha;
  abertura completa da patilha.
- Evidência: identificação, fotos de dano, teste/observação funcional, histórico.
- Crítico: bloqueio, mordente, patilha e integridade estrutural.

## FP02 — Descensor

- Visual: placas; roldanas/eixo/pino de fricção; roldana/manípulo; fechos.
- Conforto: proteção PVC.
- Funcional: retorno sem atrito; abertura/fecho; mola da patilha; teste na corda.
- Crítico: fricção, fechamento e funcionamento na corda.

## FP03 — Trava-quedas

- Visual: corpo; batente; mordente/batente e rebites; patilha; absorvedor.
- Funcional: desliza/bloqueia; molas; abertura da patilha.
- Crítico: absorvedor comprometido, falha de bloqueio, deformação e fissuras.

## FP04 — Talabarte

- Visual: fita/corda; costuras; conector; peças metálicas.
- Conforto: protetores de costura.
- Funcional: acoplamento do gancho MGO, mola, desgaste e corrosão.
- Crítico: cortes/queimaduras, costura comprometida e conector inseguro.

## FP05 — Elemento metálico

- Visual: corpo e olhais; fissuras, sulcos, deformações, desgaste, corrosão, gaiola de
  passarinho, arames saltados e achatamento.
- Funcional: alinhamento.
- Crítico: dano estrutural, olhal comprometido e desalinhamento impeditivo.

## FP06 — Elemento têxtil

- Visual: fitas; costuras.
- Funcional: ajuste.
- Crítico: corte, queimadura, desgaste estrutural e fios cortados/distendidos.

## FP07 — Corda

- Visual: corda/fita; costuras; corte, desgaste e queimadura.
- Funcional: desenvolvimento dos laços; interação com aparelhos.
- Campos adicionais: comprimento, cortes, uso e histórico de corda.
- Crítico: dano de alma/capa, corte, queimadura e falha de interação.

## FP08 — Capacete

- Visual: fitas; casco; costuras; armação/componentes; fivelas.
- Conforto: acolchoamento.
- Funcional: ajustes.
- Crítico: fissura, impacto/deformação, queimadura/contaminação e retenção insegura.

## FP09 — Cinto de segurança

- Visual: fitas; costuras; fivelas; conector; proteções; anéis.
- Conforto: acolchoados e costuras de suporte.
- Funcional: posição de fivelas e ajustes.
- Crítico: dano em fita/costura, anel/fivela/conector inseguro.

## FP10 — Assento conforto

- Visual: fitas; costuras; fivelas; conector; anéis.
- Conforto: acolchoado e costuras de suporte.
- Funcional: posição de fivelas e ajustes.
- Crítico: dano estrutural, incompatibilidade ou ajuste inseguro.

## FP11 — Conector

- Visual: corpo; gancho/bico; dedo, rebite e anel.
- Funcional: dedo de fecho; alinhamento dedo-bico; mola/articulação; segurança.
- Crítico: falha de travamento, mola, articulação ou deformação.

## FP12 — Polia

- Visual: placas; roldanas/eixo/pino; conjunto móvel/manípulo; fechos.
- Funcional: abertura/fecho da placa; teste operacional na corda.
- Crítico: placa/roldana comprometida, fecho inseguro ou falha na corda.

## Campos obrigatórios de finalização

Nenhuma ficha digital deve ser concluída sem identificação, inspetor, data, local,
respostas de todos os itens, observações dos achados, veredito, próximo controle e
assinatura. Para AV/AR/R, observação e ação/decisão devem ser obrigatórias. Para R,
deve haver quarentena ou justificativa formal de descarte/encaminhamento.
