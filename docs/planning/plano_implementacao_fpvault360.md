# Plano de implementação FP Vault360°

Estimativas são de engenharia e dependem da validação dos critérios pendentes pela FP.
Não incluem alteração automática de migrations nem decisão técnica sem aprovação.

## FASE A — Base Operacional

**Objetivo:** consolidar identidade, clientes, unidades, papéis, contratos e políticas.
**Escopo:** glossário, permissões, estados, origem de periodicidade, auditoria.
**Dependências:** validação deste modelo e decisões de negócio. **Arquivos:** `app/src`,
`supabase/migrations` apenas em projeto aprovado. **APIs/serviços:** tenants, usuários,
contratos, auditoria. **Banco:** avaliar extensões de unidade/política. **Riscos:**
alterar RLS prematuramente. **Complexidade:** alta. **Prioridade:** P0.
**Estimativa:** 1–2 semanas.

## FASE B — Inventário e Rastreabilidade

**Objetivo:** registrar ciclo de vida e localização sem perda histórica.
**Escopo:** recebimento, identificação, códigos, usuário, kit, movimentação,
quarentena, manutenção, descarte. **Dependências:** A. **Arquivos:** módulos
equipment/inventory/ropes/kits e páginas correspondentes. **APIs:** equipment, ropes,
kits, importação. **Serviços:** inventário, trilha, documentos. **Banco:** eventos,
ações e descarte a validar. **Riscos:** duplicidade de serial/importação.
**Complexidade:** alta. **Prioridade:** P0. **Estimativa:** 2–3 semanas.

## FASE C — Motor de Inspeções

**Objetivo:** digitalizar FP01–FP12 fielmente.
**Escopo:** catálogo versionado, C/B/AV/AR/R, histórico, critérios críticos,
APTO/INAPTO, periodicidade com origem, bloqueio/quarentena e reinspeção.
**Dependências:** A/B e validação das fichas. **Arquivos:** modules/inspections,
components/ChecklistForm, páginas e templates. **APIs:** inspections/templates.
**Serviços:** motor de decisão e evidências. **Banco:** resultado/classificação/ações
e versão de template. **Riscos:** liberação indevida. **Complexidade:** muito alta.
**Prioridade:** P0. **Estimativa:** 3–5 semanas.

## FASE D — Evidências e Laudos

**Objetivo:** tornar a decisão auditável e entregável.
**Escopo:** fotos por item, documentos, assinatura, PDF/laudo, histórico imutável.
**Dependências:** C. **Arquivos:** inspections, shared/storage, relatórios.
**APIs:** evidências, assinaturas, laudos. **Banco:** metadados e retenção a validar.
**Riscos:** documento sem evidência ou exposição indevida. **Complexidade:** alta.
**Prioridade:** P0. **Estimativa:** 2–3 semanas.

## FASE E — Certificações e Treinamentos

**Objetivo:** controlar competência e validade documental.
**Escopo:** catálogo, curso, emissão para usuário, documento, renovação, alertas e
qualificação do inspetor. **Dependências:** A/D. **Arquivos:** modules/training,
certificações e relatórios. **APIs:** treinamentos/certificações. **Banco:** revisar
documento/emissor/competência. **Riscos:** declarar competência sem comprovação.
**Complexidade:** média/alta. **Prioridade:** P1. **Estimativa:** 2–3 semanas.

## FASE F — Portal do Cliente

**Objetivo:** entregar informação contratada sem quebrar isolamento.
**Escopo:** equipamentos, inspeções, laudos, vencimentos, pendências e contratos.
**Dependências:** C/D e A. **Arquivos:** dashboard, contracts, reports, RLS.
**APIs:** consultas filtradas por contrato/escopo. **Banco:** nenhuma decisão sem
modelo de visibilidade aprovado. **Riscos:** vazamento entre clientes. **Complexidade:**
alta. **Prioridade:** P1. **Estimativa:** 2–4 semanas.

## FASE G — BI Executivo

**Objetivo:** indicadores confiáveis de operação e conformidade.
**Escopo:** aptos/inaptos, AV/AR/R, quarentena, vencimentos, manutenção, cobertura
de inspeção, treinamentos, contratos. **Dependências:** B–F. **Arquivos:** bi,
relatórios, views. **APIs:** summary e exportação. **Banco:** views auditáveis.
**Riscos:** indicador sem origem. **Complexidade:** média. **Prioridade:** P1.
**Estimativa:** 2 semanas.

## FASE H — Automações

**Objetivo:** reduzir atrasos e falhas operacionais.
**Escopo:** alertas de próxima inspeção, certificação, contrato, manutenção e
pendências; notificações e escalonamento. **Dependências:** C–G. **Arquivos:** jobs,
notifications, regras. **Riscos:** excesso de alertas. **Complexidade:** média.
**Prioridade:** P2. **Estimativa:** 1–2 semanas.

## FASE I — Inteligência Artificial

**Objetivo:** apoiar leitura/classificação sem decidir segurança sozinha.
**Escopo:** busca documental, sugestão de item/evidência, resumo de laudo, detecção
assistida. **Dependências:** base FP versionada, D e governança. **Arquivos:** novo
serviço isolado e auditoria. **Banco:** prompts/resultados versionados se aprovados.
**Riscos:** alucinação e liberação indevida. **Complexidade:** alta. **Prioridade:** P3.
**Estimativa:** 3–6 semanas.

## FASE J — Aplicativo Mobile

**Objetivo:** inspeção em campo com evidência e sincronização segura.
**Escopo:** captura offline, fotos, assinatura, QR, fila de sincronização, conflitos.
**Dependências:** C/D, identidade de dispositivo e política offline. **Arquivos:**
PWA/mobile, storage e sincronização. **Riscos:** dados desatualizados e conflito de
decisão. **Complexidade:** muito alta. **Prioridade:** P2 após fluxo web estável.
**Estimativa:** 4–8 semanas.

## Sequência recomendada

Começar por **C — Motor de Inspeções**, precedido por uma validação curta de A/B para
fechar estados e rastreabilidade. Em seguida D, E, F, G, H, J e por último I.

## Evitar neste momento

Não iniciar IA, gateway de pagamento, automações complexas ou aplicativo mobile antes
de o motor FP, laudo, evidências, quarentena e rastreabilidade estarem validados em
operação real. Não reconstruir autenticação, RLS ou módulos já reaproveitáveis sem gap
demonstrado.

## Menor caminho até produto operacional

1. Validar este conhecimento com inspetor/gestor FP.
2. Cadastrar FP01–FP12 versionados.
3. Implementar C/B/AV/AR/R, histórico e decisão APTO/INAPTO.
4. Fechar quarentena, manutenção, reinspeção e descarte.
5. Gerar laudo assinado com fotos.
6. Testar com a planilha e um lote real de equipamentos.
7. Só então completar certificações, portal e BI.
