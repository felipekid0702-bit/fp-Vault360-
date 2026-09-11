# Entrega FP completa — FP Vault360°

**Data:** 11/09/2026  
**Escopo:** Motor FP, não conformidade, rastreabilidade e laudo oficial.

## 1. Resumo da entrega

Foi implementado o núcleo operacional FP para digitalização das fichas FP01–FP12,
classificação técnica C/B/AV/AR/R, decisão APTO/INAPTO, tratamento de não
conformidades, rastreabilidade de movimentações e geração de laudo oficial em PDF.

A implementação preserva a arquitetura existente em Next.js, Supabase e PostgreSQL.
As estruturas legadas de inspeção, status e evidência foram mantidas e
complementadas por migrations incrementais.

## 2. O que foi criado

### 2.1 Migrations

- `010_fp_inspection_model.sql`
  - adiciona código, objetivo e documento de origem aos templates;
  - adiciona seções, obrigatoriedade e evidência aos itens;
  - adiciona classificação FP, ação e veredito;
  - prepara os templates FP01–FP12;
  - aplica regras de resultado da inspeção.

- `011_fp_inspection_templates_complete.sql`
  - complementa os itens oficiais das fichas FP01–FP12;
  - inclui verificações visuais, funcionais, de conforto, identificação e
    compatibilidade;
  - marca itens críticos e itens que exigem evidência.

- `012_fp_operational_lifecycle.sql`
  - cria o ciclo de não conformidade;
  - cria quarentena, manutenção, descarte e movimentações;
  - cria competências;
  - cria relatórios de inspeção;
  - cria views de rastreabilidade e BI operacional;
  - abre quarentena automaticamente após inspeção rejeitada.

- `013_fp_evidence_linkage.sql`
  - vincula evidência a item específico do checklist;
  - adiciona hash do documento do laudo;
  - registra alterações de status do equipamento como movimentações.

### 2.2 Templates oficiais

Foram preparados os seguintes templates:

| Código | Ficha |
|---|---|
| FP01 | Ascensor |
| FP02 | Descensor |
| FP03 | Trava-quedas |
| FP04 | Talabarte |
| FP05 | Elemento metálico |
| FP06 | Elemento têxtil |
| FP07 | Corda |
| FP08 | Capacete |
| FP09 | Cinto de segurança |
| FP10 | Assento conforto |
| FP11 | Conector |
| FP12 | Polia |

### 2.3 APIs

Foram criadas ou ampliadas as seguintes APIs:

- `/api/inspections`
  - criação e consulta de inspeções;
  - validação FP;
  - classificação por item;
  - evidências;
  - assinatura;
  - histórico;
  - veredito;
  - próximo controle.

- `/api/inspections/templates/[id]`
  - consulta de template e itens ordenados.

- `/api/inspections/[inspectionId]/evidencias`
  - upload de fotos;
  - upload de assinatura;
  - armazenamento no bucket `documents`;
  - vínculo com inspeção;
  - vínculo opcional com item do checklist.

- `/api/quarentena`
  - abertura e consulta de quarentena;
  - análise;
  - transição para reparo;
  - liberação;
  - descarte;
  - exigência de reinspeção APTO para liberação.

- `/api/manutencoes`
  - abertura e consulta de manutenção;
  - registro de reparo;
  - vínculo opcional com inspeção;
  - atualização do caso de quarentena.

- `/api/descarte`
  - registro de descarte;
  - exigência de motivo e evidência;
  - alteração do equipamento para `retired`.

- `/api/movimentacoes`
  - registro e consulta de movimentações;
  - estoque;
  - envio;
  - transferência;
  - retorno;
  - inspeção;
  - quarentena;
  - manutenção;
  - descarte.

- `/api/laudos/[inspectionId]`
  - geração do laudo PDF;
  - incorporação de imagens disponíveis;
  - registro do relatório;
  - armazenamento do PDF;
  - geração de hash SHA-256.

### 2.4 Competências e apoio operacional

Também foram criadas estruturas complementares:

- catálogo de competências;
- registro de competências por usuário;
- endpoint `/api/competencias`;
- endpoint de BI executivo;
- endpoint de portal do cliente;
- endpoint de notificações de vencimento;
- endpoint de sugestão de decisão baseada nas regras FP.

## 3. O que foi alterado

### 3.1 Motor de inspeções

Arquivos principais alterados:

- `app/src/modules/inspections/types.ts`;
- `app/src/modules/inspections/service.ts`;
- `app/src/modules/inspections/components/ChecklistForm.tsx`;
- `app/src/app/api/inspections/route.ts`;
- `app/src/app/(dashboard)/inspecoes/nova/page.tsx`.

Alterações:

- substituição operacional de OK/NOK/NA por C/B/AV/AR/R;
- associação visual dos itens às seções das fichas;
- coleta de histórico;
- coleta de local;
- coleta de próximo controle;
- coleta de assinatura;
- coleta de evidências;
- validação de observação e ação;
- validação de veredito;
- validação de gatilhos críticos.

### 3.2 Serviço de treinamentos e certificações

O serviço de treinamentos foi ampliado para registrar emissor e documento
relacionado à certificação, mantendo cálculo de validade e vínculo com usuário,
treinamento e catálogo de certificação.

### 3.3 Laudos

O endpoint de laudos deixou de retornar apenas HTML e passou a gerar PDF real com
`pdfkit`, armazenando o arquivo no Supabase Storage e registrando seu hash.

### 3.4 Não conformidades

O endpoint de quarentena passou a controlar transições e impedir liberação sem
reinspeção APTO vinculada ao mesmo equipamento.

### 3.5 Evidências

Foi adicionada uma rota de upload para imagens de inspeção e assinaturas. As
evidências podem ser vinculadas diretamente a um item específico da ficha.

## 4. Tabelas utilizadas

### 4.1 Tabelas existentes reaproveitadas

- `equipment`;
- `equipment_categories`;
- `manufacturers`;
- `locations`;
- `kits`;
- `kit_items`;
- `users`;
- `tenants`;
- `checklist_templates`;
- `checklist_items`;
- `inspections`;
- `inspection_items_result`;
- `inspection_evidences`;
- `inspection_signatures`;
- `documents`;
- `trainings`;
- `certifications`;
- `user_certifications`;
- `audit_log`.

### 4.2 Tabelas criadas

- `equipment_movements`
  - histórico de movimentações do equipamento.

- `maintenance_records`
  - registros de manutenção, reparo, limpeza e reinspeção.

- `quarantine_cases`
  - casos de quarentena, análise, reparo, liberação e descarte.

- `disposal_records`
  - registro formal de descarte e evidência.

- `inspection_reports`
  - número, arquivo, hash, geração e assinatura do laudo.

- `competency_catalog`
  - catálogo de competências profissionais.

- `user_competencies`
  - competências atribuídas a usuários, com validade e documento.

### 4.3 Colunas adicionadas

Em `checklist_templates`:

- `template_code`;
- `objective`;
- `source_document`.

Em `checklist_items`:

- `section`;
- `required`;
- `evidence_required`.

Em `inspection_items_result`:

- `classification`;
- `action_required`.

Em `inspections`:

- `history_notes`;
- `inspection_location`;
- `verdict`;
- `history_fall`;
- `history_chemical_or_abrasive`;
- `history_temperature_out_of_range`;
- `history_unauthorized_modification`.

Em `inspection_evidences`:

- `checklist_item_id`.

Em `inspection_reports`:

- `document_hash`.

Em `user_certifications`:

- `issued_by`;
- `renewal_of`;
- `document_path`.

## 5. Telas criadas ou alteradas

### Alteradas

- Tela de nova inspeção:
  - seleção de equipamento;
  - seleção de template FP;
  - classificação C/B/AV/AR/R;
  - histórico;
  - local;
  - próximo controle;
  - evidências;
  - assinatura;
  - veredito APTO/INAPTO.

- Tela de relatórios:
  - indicadores existentes reutilizados para exibir inventário, quarentena,
    conformidade, vencimentos e operação.

### APIs prontas para telas futuras

As seguintes áreas possuem backend, mas ainda não possuem uma tela operacional
completa dedicada:

- gestão visual de quarentena;
- análise e transição de casos;
- manutenção;
- descarte;
- movimentações;
- competências;
- portal do cliente;
- laudo e download de PDF;
- upload de fotos e assinatura.

## 6. Fluxos implementados

### 6.1 Inspeção FP

```text
Selecionar equipamento
↓
Selecionar template FP01–FP12
↓
Informar histórico e local
↓
Responder todos os itens
↓
Classificar C/B/AV/AR/R
↓
Informar observações e ações
↓
Adicionar evidências
↓
Assinar
↓
Informar próximo controle
↓
Gerar APTO ou INAPTO
```

### 6.2 Não conformidade

```text
Inspeção INAPTA
↓
Equipamento em quarentena
↓
Análise técnica
↓
Reparo autorizado ou decisão de descarte
↓
Reinspeção
↓
Liberação somente se APTO
```

### 6.3 Rastreabilidade

```text
Estoque
↓
Envio
↓
Cliente/unidade
↓
Retorno
↓
Inspeção
↓
Quarentena ou liberação
↓
Manutenção, nova inspeção ou descarte
```

### 6.4 Laudo

```text
Inspeção concluída
↓
Consulta de itens, histórico e evidências
↓
Geração do PDF
↓
Incorporação de fotos
↓
Registro de assinatura
↓
Armazenamento no Storage
↓
Registro de hash e número do laudo
```

## 7. Regras de negócio implementadas

### Classificação

- `C`: comentário;
- `B`: bom;
- `AV`: a vigiar;
- `AR`: a reparar;
- `R`: rejeitar.

### Regras de preenchimento

- todos os itens do template devem ser respondidos;
- AV, AR e R exigem observação;
- AV, AR e R exigem ação ou decisão;
- AR e R devem ser enviados como NOK;
- AR e R exigem veredito INAPTO;
- R exige ação de quarentena, descarte ou retirada;
- próximo controle é obrigatório;
- assinatura é obrigatória;
- evidência é obrigatória para AR, R e gatilhos históricos.

### Gatilhos históricos

Os seguintes eventos levam o processo para tratamento de rejeição:

- queda de fator 1 ou maior;
- contato químico ou abrasivo;
- temperatura abaixo de -40 °C ou acima de 80 °C;
- modificação não autorizada de elemento de segurança.

### Resultado

- itens AV podem gerar `approved_with_restriction`;
- itens AR/R geram `rejected`;
- histórico crítico gera `rejected`;
- itens críticos NOK geram `rejected`;
- rejeição ou veredito INAPTO abre quarentena;
- equipamento em quarentena não deve ser liberado sem reinspeção APTO.

### Descarte

- exige motivo;
- exige evidência;
- registra responsável;
- altera o equipamento para `retired`.

### Rastreabilidade

- alterações de status podem gerar movimentação automática;
- movimentação registra equipamento, origem, destino, responsável, data e motivo;
- evidência pode apontar para a inspeção e para o item específico;
- laudo recebe número e hash para controle de integridade.

## 8. Pendências identificadas

### Aplicação no ambiente remoto

- aplicar as migrations 010, 011, 012 e 013 no Supabase remoto;
- validar RLS das novas tabelas em ambiente controlado;
- confirmar buckets e policies do Supabase Storage.

### Validação operacional

- testar FP01–FP12 com equipamentos reais;
- validar itens e criticidade com inspetor competente;
- validar matriz AV/AR;
- validar periodicidades por fabricante, norma, risco e contrato;
- validar autoridade para liberar quarentena;
- validar retenção de fotos, laudos e audit log.

### Interface

- criar tela completa de quarentena;
- criar tela de análise e transição de casos;
- criar tela de manutenção;
- criar tela de descarte;
- criar tela de movimentações;
- criar tela de competências;
- criar portal visual do cliente;
- adicionar captura visual de assinatura;
- adicionar seleção/upload de fotos diretamente no formulário de inspeção.

### Laudo

- validar modelo visual oficial com a FP;
- revisar identidade visual e campos obrigatórios;
- incluir assinatura gráfica incorporada ao PDF quando a política for definida;
- validar disponibilização/download conforme RLS e contrato.

### Integridade de dados

- executar testes de transição de status;
- validar duplicidade na importação da planilha;
- garantir que todos os eventos automáticos tenham ator identificado;
- revisar trigger de movimentação em conjunto com as políticas de auditoria;
- atualizar tipos gerados do Supabase após aplicação das migrations.

### Produto

- implementar jobs agendados de notificações;
- concluir BI executivo com filtros e produtividade;
- concluir portal do cliente;
- desenvolver sincronização mobile;
- manter IA somente como apoio, sem decisão autônoma de segurança.

## 9. Validação técnica realizada

Foram executados:

```text
npm run typecheck
npm run build
```

Resultado:

- TypeScript aprovado;
- build de produção aprovado;
- 46 rotas geradas;
- APIs FP reconhecidas pelo Next.js;
- nenhum erro de compilação nos arquivos alterados.

## 10. Conclusão

As quatro entregas estão implementadas no código e estruturadas para validação
operacional:

1. motor FP completo;
2. não conformidade;
3. rastreabilidade;
4. laudo oficial em PDF.

O próximo passo técnico obrigatório é aplicar as migrations em ambiente controlado e
executar um piloto com equipamentos reais, pois a aderência final depende da
validação do responsável técnico da FP e não apenas da compilação do sistema.
