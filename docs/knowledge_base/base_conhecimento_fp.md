# Base de conhecimento FP Vault360°

> Documento derivado exclusivamente dos materiais oficiais disponíveis em
> `app/public/docs/training_reference`, `app/public/docs/inspection_templates` e
> `app/public/docs/business_rules`. A implementação atual é fonte secundária.

## 1. Fontes analisadas e autoridade

### 1.1 Referências técnicas

- `Apostila de Treinamento FP Safe v2.pdf`: fundamentos, gestão do ciclo de vida,
  inspeção, manutenção, quarentena, descarte e inspeção por família.
- `EN 365 - FP SOLUÇÕES...pdf` e `BS_EN_365_2004...pdf`: informação do fabricante,
  inspeção periódica e documentação de EPI contra quedas.
- `EN-341 - FP SOLUÇÕES...pdf`: descensores e requisitos de uso/manutenção.
- `NBR 17151 - FP SOLUÇÕES...pdf`, `nbr16489...pdf` e `nbr16489-180409110243.pdf`:
  referências nacionais de acesso por corda e proteção contra quedas.
- `International_Code_of_Practice_TC-102BRA.pdf`: práticas IRATA para acesso industrial
  por corda, competência, supervisão e segurança operacional.
- `nr-35-atualizada-2022...pdf`: trabalho em altura, capacitação, planejamento e
  responsabilidades.
- `217004150-BSI-BS-EN-365-docx.docx`: cópia/referência documental da BS EN 365.

Os dois arquivos `nbr16489` têm o mesmo tamanho e conteúdo aparente; devem ser tratados
como uma fonte duplicada, não como duas regras independentes.

### 1.2 Fichas FP

FP01 Ascensor; FP02 Descensor; FP03 Trava-quedas; FP04 Talabarte; FP05 Elemento
metálico; FP06 Elemento têxtil; FP07 Corda; FP08 Capacete; FP09 Cinto de segurança;
FP10 Assento conforto; FP11 Conector; FP12 Polia.

### 1.3 Planilha operacional

`Planilha de Controle Inspeção.xlsx`, aba `Plan1`, contém as colunas:
Equipamento, Usuário, Referência, Fabricante, Modelo, kit, Nº Individual, NF,
1ª Utiliz., Data da Inspeção, Inspecionado por, próxima Insp., Data da Compra e
Local da Inspeção.

## 2. Conceitos técnicos

- **EPI contra queda**: equipamento destinado a proteger o trabalhador contra queda
  de altura; sua eficácia depende de seleção, compatibilidade, uso, inspeção e gestão.
- **SPIQ**: sistema de proteção individual contra quedas, composto por elementos
  compatíveis e usados conforme fabricante, norma e análise de risco.
- **Elemento de ligação**: componente que conecta o trabalhador, sistema ou ponto de
  ancoragem; inclui conectores, talabartes, cordas e dispositivos associados.
- **Inspetor competente**: pessoa qualificada para reconhecer danos, compreender o
  equipamento e tomar decisão documentada de liberar, restringir, reparar, quarentenar
  ou retirar de serviço.
- **Verificação histórica**: informação fornecida pelo usuário sobre quedas, produtos
  químicos, abrasivos, temperaturas extremas e modificações externas.
- **Validade não é vida útil**: prazo nominal ou validade documental não substitui a
  avaliação da condição real, histórico, uso, armazenamento e inspeções.

## 3. Gatilhos de rejeição sistemática

As fichas FP repetem quatro situações em que o resultado da verificação fica sob
reserva ou o componente deve ser considerado para rejeição imediata, sem depender
apenas de aparência:

1. sofreu queda de fator 1 ou maior;
2. esteve em contato com produto químico ou material abrasivo;
3. foi submetido a temperatura inferior a -40 °C ou superior a 80 °C;
4. teve elemento de segurança retocado, modificado ou alterado fora da instalação
   autorizada do fabricante.

Esses eventos exigem histórico registrado, segregação/quarentena e decisão formal do
responsável competente. A aplicação não deve liberar automaticamente o equipamento
apenas porque todos os itens visuais foram marcados como bons.

## 4. Classificação dos achados

As fichas usam cinco marcações:

- **B — Bom**: condição adequada, sem ação corretiva imediata.
- **AV — A vigiar**: condição observável que exige acompanhamento e registro; não
  equivale automaticamente a aprovação irrestrita.
- **AR — A reparar**: requer manutenção/reparo autorizado antes da liberação.
- **R — Rejeitar**: não conformidade que impede continuidade em serviço e exige
  quarentena, retirada ou descarte conforme avaliação.
- **C — Comentário**: campo para descrever achado, contexto, limitação ou evidência.

O veredito final das fichas é binário: **APTO para continuar em serviço** ou
**INAPTO para continuar em serviço**. A regra operacional deve preservar o detalhe
por item e registrar como o inspetor chegou ao veredito.

## 5. Critérios de conformidade e não conformidade

### Conformidade

- identificação legível e rastreável;
- histórico e documentação disponíveis;
- integridade visual dos componentes;
- funcionamento conforme finalidade;
- compatibilidade entre componentes;
- ausência de gatilho de rejeição sistemática;
- resultado documentado, datado, assinado e com próxima inspeção definida.

### Não conformidade

- qualquer R em item de segurança;
- deformação, fissura, corrosão relevante, corte, queimadura, abrasão, contaminação,
  fios ou costuras comprometidos;
- falha de trava, mola, ajuste, fechamento, alinhamento ou teste operacional;
- absorvedor acionado ou comprometido;
- queda, contato químico/abrasivo, temperatura extrema ou modificação não autorizada;
- ausência de identificação, histórico ou evidência necessária para decisão segura.

Um item AV ou AR não deve ser reduzido a “observação livre”: deve gerar uma ação,
responsável, prazo e decisão de liberação/restrição.

## 6. Manutenção, quarentena e descarte

- Inspeção e manutenção são processos diferentes: a inspeção decide a condição; a
  manutenção trata a causa apenas quando permitida pelo fabricante.
- Equipamento suspeito, sem histórico suficiente, com achado AR/R ou submetido a
  evento crítico deve ser retirado do uso e identificado em quarentena.
- Reparos, ajustes e substituições somente podem ser feitos por pessoa/organização
  autorizada, com rastreabilidade da intervenção.
- Equipamento reprovado não deve retornar ao estoque de uso. A retirada/descarte deve
  ser registrada, com motivo, data, responsável e, quando aplicável, evidência de
  descaracterização.
- Para têxteis, a apostila destaca limpeza adequada, secagem completa por período
  mínimo de 48 horas, à sombra e em local limpo/ventilado; não se deve presumir que
  toda higienização seja aplicável a qualquer material.

## 7. Periodicidade e tipos de inspeção

As fontes distinguem:

- inspeção na aquisição/recebimento;
- inspeção rotineira ou pré-uso;
- inspeção periódica formal;
- inspeção extraordinária após evento, dano, queda, contaminação ou dúvida;
- inspeção de fábrica/manutenção especializada quando aplicável.

O intervalo deve respeitar fabricante, norma, análise de risco e política contratual.
As fichas exigem data do controle e data do próximo controle, mas não fixam um único
intervalo universal. O sistema não deve inventar periodicidade global.

## 8. Famílias e defeitos por equipamento

### FP01 — Ascensor

Visual: corpo, batente anti-retorno, mordente e rebites, patilha/eixo e poliamida.
Funcional: subida/deslizamento, bloqueio na tração para baixo, molas do mordente e
patilha, abertura completa da patilha. Referência de resistência: ensaio destrutivo
EN 567. Risco central: falha de bloqueio ou dano estrutural.

### FP02 — Descensor

Visual: placas fixas/móveis, elementos de atrito (roldana/eixo/pino), conjunto
roldana/manípulo, elementos de fecho. Conforto: proteção PVC. Funcional: mola e
ausência de atrito, abertura/fecho, mola da patilha e teste na corda. Referência:
EN 341. Risco central: perda de controle/fricção ou fechamento inseguro.

### FP03 — Trava-quedas

Visual: corpo, batente anti-retorno, mordente/batente e rebites, patilha e absorvedor
de energia. Funcional: deslizar/bloquear, molas, patilha e abertura. Referência
indicada: EN 567 para bloqueador na corda. Absorvedor desgastado, contaminado ou com
proteção afetada é achado crítico.

### FP04 — Talabarte

Visual: fita/corda, costuras, conector, peças metálicas. Conforto: protetores de
costura. Funcional: acoplamento do gancho MGO, mola, desgaste e corrosão. Referência
indicada: EN 795 para amarração provisória classe B.

### FP05 — Elemento metálico

Visual: corpo e olhais; procurar fissuras, sulcos, deformações, desgaste, corrosão,
gaiola de passarinho, arames saltados e trechos achatados. Funcional: alinhamento.
Referência indicada: EN 795 para ancoragem.

### FP06 — Elemento têxtil

Visual: fitas (cortes, desgaste, queimadura) e costuras (fios cortados, distendidos
ou desgastados). Funcional: ajustes. Referência indicada: EN 795 para amarração
provisória classe B. Qualquer dano têxtil relevante exige retirada até decisão.

### FP07 — Corda

Visual: cordas/fitas e costuras, cortes, desgaste e queimaduras. Funcional:
desenvolvimento dos laços e interação com aparelhos. Referências indicadas: EN 1801
e EN 892. O módulo deve preservar comprimento, cortes, uso e histórico.

### FP08 — Capacete

Visual: fitas, casco (fissuras, marcas, queimaduras, contaminação), costuras,
armação/componentes e fivelas. Conforto: acolchoamento. Funcional: ajustes. Impacto,
fissura, queimadura, contaminação ou falha de retenção requer decisão restritiva.

### FP09 — Cinto de segurança

Visual: fitas, costuras, fivelas, conector, proteções, anéis de conexão. Conforto:
acolchoados e costuras de suporte. Funcional: posição das fivelas e ajustes.
Referências: EN 358, EN 813, EN 361, Z359 e EN 12277.

### FP10 — Assento conforto

Visual: fitas, costuras, fivelas, conector, anéis. Conforto: acolchoado e costuras
de suporte. Funcional: posição das fivelas e ajustes. Deve ser tratado como acessório
associado ao sistema, com compatibilidade documentada.

### FP11 — Conector

Visual: corpo, gancho/bico, dedo, rebite e anel de fecho. Funcional: dedo de fecho,
alinhamento dedo-bico, mola/articulação e sistema de segurança. Referência: EN 362.
Falha de fechamento ou segurança impede liberação.

### FP12 — Polia

Visual: placas, roldanas e elementos de atrito, roldana/manípulo e fechos. Funcional:
abertura/fecho da placa e teste na corda. Referência indicada: CE 0639. Deve ser
avaliada em compatibilidade com corda e configuração de uso.

## 9. Evidências e documentação obrigatórias

Cada inspeção deve manter, no mínimo:

- identificação do equipamento e referência;
- fabricante, modelo, número individual/serial, NF e datas de compra/primeiro uso;
- usuário, local, inspetor e organização;
- tipo e data da inspeção;
- resultado de cada item com C/B/AV/AR/R e comentários;
- resultado final APTO/INAPTO;
- data do próximo controle;
- evidências fotográficas quando houver dano, identificação, reparo, descarte ou
  decisão excepcional;
- assinatura/visto do controlador;
- histórico de movimentações, manutenção, quarentena e descarte.

## 10. Papéis e responsabilidades

- **Usuário/cliente**: fornece histórico correto, usa conforme manual, informa queda,
  dano, contaminação e guarda o equipamento corretamente.
- **Inspetor competente**: examina, testa dentro dos limites seguros, registra
  evidências e decide/recomenda a condição.
- **Responsável técnico/gestor**: aprova critérios, trata AR/R, autoriza retorno,
  manutenção, descarte e controla prazos.
- **Almoxarifado**: identifica, armazena, segrega quarentena e mantém rastreabilidade.
- **Organização empregadora/prestadora**: fornece treinamento, procedimento, recursos,
  controle documental e não disponibiliza equipamento não conforme.
- **Fabricante/assistência autorizada**: define instruções, limites, reparos e ensaios.

## 11. Limites da fonte

As fontes não definem de modo único: dias exatos de periodicidade, matriz formal de
severidade, códigos de status de software, critérios de aprovação de cada combinação
AV/AR, formato de laudo e retenção temporal dos documentos. Esses pontos devem ser
decididos pela FP antes de virar regra automática.
