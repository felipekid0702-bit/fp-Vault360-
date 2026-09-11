# Sprint 1 — Estabilização Operacional

## Escopo

Esta Sprint tratou somente da estabilização local dos fluxos de equipamentos, kits e inspeções. Não foram iniciadas funcionalidades de Clientes, Relatórios, Importação, Serviços ou Controle Avançado de Permissões. Não houve alteração de migrations, autenticação, Vercel ou Supabase remoto.

## Diagnóstico técnico

Foram auditados os fluxos de API, services, formulários, páginas e tabelas relacionadas.

### Falhas encontradas

1. O service de equipamentos inseria registros sem `tenant_id`, embora a coluna seja obrigatória em `equipment`.
2. Os services de categorias e fabricantes também não preenchiam `tenant_id`, impedindo a criação de catálogos vinculados ao tenant.
3. O service de inspeções inseria registros sem `tenant_id`, embora a coluna seja obrigatória em `inspections`.
4. O cadastro de equipamentos tratava somente `model` como dado operacional e não permitia selecionar categoria e fabricante.
5. O formulário apresentava o campo como “Número de série”, sem refletir o uso operacional de série/lote.
6. Não havia edição de equipamentos na listagem.
7. A nova inspeção não oferecia cadastro rápido de equipamento sem sair da tela.
8. Os estados de sucesso do cadastro de equipamento não eram apresentados ao usuário; os erros já existentes foram preservados e mantidos explícitos.

## Correções realizadas

- Criado helper server-side para obter usuário autenticado e `tenant_id`, propagando erros de sessão/perfil.
- Equipamentos, categorias e fabricantes agora são inseridos com `tenant_id` e usuário responsável.
- Inspeções agora são inseridas com `tenant_id` e inspetor autenticado.
- O cadastro de equipamento passou a usar:
  - categoria obrigatória;
  - modelo;
  - fabricante opcional;
  - Nº Série / Lote opcional;
  - código interno opcional;
  - data de aquisição;
  - vida útil.
- O código interno continua opcional e não bloqueia o cadastro.
- Adicionada edição por `PATCH /api/equipment/[id]`.
- Adicionados feedbacks de salvamento, erro e estado de carregamento.
- Adicionados catálogos reais de categorias e fabricantes no formulário.
- Adicionado cadastro rápido de equipamento na tela de início da inspeção.
- Após o cadastro rápido, o usuário retorna automaticamente ao checklist escolhido.
- Mantida a validação das classificações `C`, `B`, `AV`, `AR` e `R`.
- Mantidas as regras de observação, ação, evidência, assinatura, veredito e resultado final.

## Arquivos alterados

- `app/src/shared/lib/supabase/tenant.ts` — novo helper de contexto autenticado.
- `app/src/modules/equipment/service.ts`
- `app/src/modules/equipment/components/EquipmentForm.tsx`
- `app/src/modules/inventory/service.ts`
- `app/src/modules/inspections/service.ts`
- `app/src/modules/inspections/components/InlineEquipmentCreate.tsx` — novo cadastro rápido.
- `app/src/app/(dashboard)/equipamentos/page.tsx`
- `app/src/app/(dashboard)/inspecoes/nova/page.tsx`
- `docs/auditoria/sprint1_estabilizacao_operacional.md`

## APIs alteradas ou utilizadas

### Alteradas por correção de persistência

- `POST /api/equipment`
- `PATCH /api/equipment/[id]`
- `POST /api/categorias`
- `POST /api/fabricantes`
- `POST /api/inspections`

### Utilizadas sem alteração funcional

- `GET /api/equipment`
- `GET /api/categorias`
- `GET /api/fabricantes`
- `GET /api/inspections`
- `GET /api/inspections/templates/[id]`
- `GET /api/kits`
- `POST /api/kits`

Nenhuma API existente foi removida.

## Tabelas utilizadas

- `users`
- `equipment`
- `equipment_categories`
- `manufacturers`
- `kits`
- `kit_items`
- `checklist_templates`
- `checklist_items`
- `inspections`
- `inspection_items_result`
- `inspection_evidences`
- `inspection_signatures`

As migrations existentes não foram alteradas nem aplicadas.

## Fluxos revisados

### Equipamentos

Cadastro → persistência com tenant → atualização da listagem → pesquisa via API → edição.

### Kits

Listagem com componentes vinculados e cadastro usando `equipment_ids`. O fluxo foi auditado e não recebeu mudança funcional nesta Sprint.

### Inspeções

Equipamento existente → escolha do checklist → preenchimento FP → resultado → histórico.

Também foi adicionado:

Equipamento novo → cadastro rápido na tela da inspeção → retorno automático ao checklist.

## Templates e regras FP

Os templates FP01–FP12 existentes continuam sendo carregados do banco. Esta Sprint não criou nem substituiu templates.

As classificações existentes continuam disponíveis:

- `C` — comentário;
- `B` — bom;
- `AV` — a vigiar;
- `AR` — a reparar;
- `R` — rejeitar.

As validações existentes foram preservadas:

- `AV`, `AR` e `R` exigem observação;
- `AV`, `AR` e `R` exigem ação;
- `AR` e `R` exigem status `NOK`;
- `AR` e `R` exigem veredito `INAPTO`;
- gatilhos históricos exigem evidência e veredito `INAPTO`;
- `R` exige ação de quarentena, descarte ou retirada;
- assinatura e próximo controle são obrigatórios.

## Validações executadas

Executado em `fpvault360/app`:

```text
npm run typecheck
Resultado: aprovado

npm run build
Resultado: aprovado
```

O build compilou e gerou as rotas existentes, incluindo:

- `/equipamentos`;
- `/kits`;
- `/inspecoes`;
- `/inspecoes/nova`;
- `/api/equipment`;
- `/api/equipment/[id]`;
- `/api/kits`;
- `/api/inspections`.

## Testes manuais

Os cenários manuais contra dados reais não foram executados nesta sessão porque dependem de sessão autenticada e conexão com o banco Supabase. Não foram criados dados fictícios nem realizadas alterações remotas para simular os cenários.

Status:

- cadastro real de equipamento: pendente de homologação;
- pesquisa de equipamento persistido: pendente de homologação;
- edição real: pendente de homologação;
- inspeção com equipamento existente: pendente de homologação;
- cadastro rápido durante inspeção: validado por build, pendente de execução autenticada;
- histórico da inspeção: pendente de homologação;
- navegação completa: rotas compiladas, validação visual/interativa pendente.

## Problemas não resolvidos

- Ainda é necessário executar os cenários com usuário autenticado e banco Supabase acessível.
- A disponibilidade dos catálogos depende de categorias e fabricantes já existentes ou cadastrados pelo usuário.
- A captura visual de assinatura e upload de evidências continua dependendo das policies de Storage e do fluxo de homologação.
- Não foi possível validar a execução SQL das migrations nesta Sprint, conforme solicitado.
- A listagem não implementa paginação server-side; a pesquisa permanece disponível pela API.

## Pendências para a Sprint 2

1. Executar os cinco cenários operacionais em homologação.
2. Confirmar persistência, RLS, histórico, evidências e assinatura.
3. Validar visualmente todos os links e estados vazios com a aplicação em execução.
4. Avaliar paginação da listagem somente após medir o volume real de equipamentos.
5. Corrigir eventuais incompatibilidades reveladas pelo banco remoto sem alterar o escopo da Sprint 1.

## Restrições respeitadas

- Nenhum commit foi executado.
- Nenhum push foi executado.
- Nenhuma migration foi aplicada.
- Nenhuma alteração foi feita no Supabase remoto.
- Nenhuma alteração foi feita na Vercel.
- Nenhuma funcionalidade de Sprint futura foi iniciada.
