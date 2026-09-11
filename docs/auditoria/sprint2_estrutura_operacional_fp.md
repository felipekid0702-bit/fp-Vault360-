# Sprint 2 — Estrutura Operacional FP

## Escopo entregue

Foi preparada a estrutura local para separar FP Soluções de clientes, organizar cadastros operacionais e preservar a rastreabilidade dos equipamentos nas inspeções. Nenhuma migration foi aplicada ao Supabase remoto. Não houve commit, push ou deploy.

## Tabelas criadas

- `clients`
  - nome;
  - razão social;
  - CNPJ;
  - e-mail;
  - telefone;
  - contato principal;
  - observações;
  - status;
  - timestamps, usuário de criação/alteração e exclusão lógica.

## Tabelas alteradas

- `manufacturers`
  - `status`;
  - `notes`;
  - índice único por tenant e nome ativo.
- `equipment`
  - `owner_type` (`fp` ou `client`);
  - `client_id`;
  - índices de proprietário e cliente;
  - regra que impede equipamento FP com cliente e exige cliente quando o proprietário é cliente.
- `kits`
  - `client_id`;
  - `description`;
  - índice por cliente.
- `roles`
  - preparação dos códigos `sup_master`, `master01`, `master02`, `master03` e `submaster`.

## Migration criada

- `supabase/migrations/014_fp_operational_structure.sql`

A migration é aditiva e não altera migrations anteriores. Ela não foi executada.

## APIs criadas

- `GET/POST /api/clientes`
- `PATCH/DELETE /api/clientes/[id]`
- `PATCH/DELETE /api/fabricantes/[id]`

## APIs alteradas

- `/api/fabricantes`
  - passou a aceitar nome, site, status e observações.
- `/api/equipment`
  - passou a aceitar proprietário FP/cliente, cliente, fabricante, categoria e filtros operacionais.
- `/api/kits`
  - passou a aceitar cliente opcional e descrição.

## Services alterados

- `inventory/service.ts`
  - fabricantes completos;
  - clientes;
  - atualização;
  - exclusão lógica;
  - auditoria das mutações.
- `equipment/service.ts`
  - filtros por proprietário, cliente, fabricante e categoria;
  - vínculo com cliente;
  - auditoria de criação, alteração e exclusão lógica.
- `inspections/service.ts`
  - seleção de equipamento enriquecida com categoria, fabricante, proprietário e cliente.
- `kits/service.ts`
  - cliente e descrição;
  - itens continuam sendo referências a equipamentos existentes via `kit_items`.

## Componentes e telas alterados

- Menu principal:
  - `Cadastros / Clientes`;
  - `Cadastros / Fabricantes`.
- Tela de fabricantes:
  - nome;
  - site;
  - status;
  - observações;
  - edição.
- Tela de clientes:
  - cadastro;
  - edição;
  - pesquisa preparada pela API;
  - status;
  - exclusão lógica disponível pela API.
- Tela de equipamentos:
  - proprietário FP Soluções ou Cliente;
  - cliente condicionado ao proprietário;
  - catálogo de clientes.
  - filtros por proprietário, cliente, fabricante, categoria, status e texto.
- Tela de kits:
  - cliente opcional;
  - descrição;
  - itens permanecem vinculados a equipamentos existentes.
- Nova inspeção:
  - categoria;
  - modelo;
  - fabricante;
  - série/lote;
  - proprietário;
  - cliente, quando aplicável.

## Associação FP01–FP12

O sistema continua utilizando os templates existentes e a associação por `equipment_categories.checklist_template_id`/`category_id`, sem duplicar fichas. A tela de inspeção filtra os checklists compatíveis com a categoria do equipamento.

O catálogo oficial de templates não foi recriado nesta Sprint. A associação definitiva depende de as categorias do ambiente terem o `checklist_template_id` correspondente aos templates oficiais FP01–FP12.

## Auditoria operacional

Foram adicionados registros de auditoria para:

- cadastro de fabricante;
- alteração de fabricante;
- exclusão lógica de fabricante;
- cadastro de cliente;
- alteração de cliente;
- exclusão lógica de cliente;
- alteração de equipamento;
- exclusão lógica de equipamento.

O cadastro de equipamento já utilizava o helper de auditoria existente. Os eventos são gravados via `log_audit`.

## Segurança e permissões futuras

A migration prepara os papéis globais solicitados:

- `SUP_Master`;
- `Master01`;
- `Master02`;
- `Master03`;
- `SubMaster`.

Não foram criadas telas, usuários, login novo ou regras de autorização adicionais nesta Sprint.

## Testes executados

### TypeScript

```text
npm run typecheck
Resultado: aprovado
```

### Build

```text
npm run build
Resultado: aprovado
```

O build gerou 48 páginas/rotas, incluindo:

- `/clientes`;
- `/fabricantes`;
- `/equipamentos`;
- `/kits`;
- `/inspecoes/nova`;
- `/api/clientes`;
- `/api/clientes/[id]`;
- `/api/fabricantes/[id]`.

## Testes manuais

Os cenários com dados reais não foram executados nesta sessão porque exigem sessão autenticada e banco Supabase acessível. Não foram criados dados fictícios nem aplicadas migrations remotas.

| Cenário | Resultado |
|---|---|
| Cadastrar, editar e pesquisar fabricante | Pendente de homologação autenticada |
| Cadastrar, editar e pesquisar cliente | Pendente de homologação autenticada |
| Equipamento FP | Fluxo implementado; execução real pendente |
| Equipamento de cliente | Fluxo implementado; execução real pendente |
| Inspeção de equipamento cliente | Rastreabilidade implementada; execução real pendente |
| Associação FP01–FP12 | Estrutura preservada; validação dos vínculos no banco pendente |

## Pendências encontradas

1. A migration 014 ainda precisa ser aplicada primeiro em homologação.
2. A tabela `clients` precisa ser validada com as policies RLS do ambiente.
3. É necessário confirmar que todas as categorias FP possuem `checklist_template_id` correspondente.
4. A exclusão lógica já está disponível por API, mas a tela ainda não possui botão explícito de exclusão.
5. A validação de CNPJ está preparada para unicidade no banco, mas não inclui validação algorítmica de dígitos nesta Sprint.

## Pendências para Sprint 3

- filtros visuais combinados na listagem de equipamentos;
- tela de histórico de alterações por entidade;
- controle administrativo da alteração manual de checklist;
- homologação da associação FP01–FP12;
- testes automatizados dos endpoints de cadastros;
- botão de exclusão lógica com confirmação e feedback;
- estrutura de unidades e contatos operacionais de clientes.

## Restrições respeitadas

- Nenhuma migration foi aplicada ao Supabase remoto.
- Nenhum dado fictício foi criado.
- Nenhum commit foi executado.
- Nenhum push foi executado.
- Nenhum deploy ou alteração na Vercel foi executado.
- Nenhuma tela de login ou criação de usuários foi implementada.
