# Estabilização Pré-Sprint 3

**Data:** 11/09/2026  
**Escopo:** estabilização da aplicação local existente.  
**Fora do escopo:** novas funcionalidades, Sprint 3, alteração das regras FP, aplicação de migrations remotas e criação de dados fictícios.

## Erros encontrados

### 1. Usuário sem tenant operacional

O schema permite que o Super Master tenha `users.tenant_id = NULL`, mas os services de equipamentos, fabricantes, clientes e kits exigem um tenant para gravar dados.

O helper `getAuthenticatedTenant` tratava qualquer `tenant_id` nulo como erro, inclusive para Super Master.

### 2. Consultas incompatíveis com banco anterior à Migration 014

Enquanto a Migration 014 não está aplicada, as relações abaixo não existem:

- `clients`;
- `equipment.client_id`;
- `equipment.owner_type`;
- `kits.client_id`;
- `manufacturers.status`.

As consultas com relações novas retornavam erro do PostgREST e afetavam equipamentos e kits.

### 3. Cache local do Next.js

Execuções concorrentes de `npm run dev` e `npm run build` causavam chunks inexistentes, arquivos CSS 404 e erros de runtime/hidratação aparentes.

## Causa raiz

- contexto de tenant incompleto para Super Master;
- aplicação local conectada a um banco ainda anterior à Migration 014;
- dois processos Next.js disputando o mesmo diretório `.next`.

## Correções realizadas

### Tenant

Arquivo: [tenant.ts](../../app/src/shared/lib/supabase/tenant.ts)

- usuários comuns continuam usando o próprio `tenant_id`;
- Super Master passa a usar o tenant marcado como `is_master`;
- mensagem de erro foi tornada explícita quando não existe tenant operacional;
- a regra `Super Master sem tenant_id` foi preservada.

### Bootstrap

Arquivo: [bootstrap/route.ts](../../app/src/app/api/admin/bootstrap/route.ts)

- o bootstrap administrativo garante a existência do tenant master;
- o nome pode ser configurado por `MASTER_TENANT_NAME`;
- o padrão institucional é `FP Soluções em Altura`;
- nenhuma criação ocorreu durante esta auditoria.

### Equipamentos e inventário

Arquivos:

- [equipment/service.ts](../../app/src/modules/equipment/service.ts);
- [inventory/service.ts](../../app/src/modules/inventory/service.ts).

Foram mantidos fallbacks explícitos para o schema anterior, com registro no console administrativo:

- equipamentos FP podem ser consultados e gravados na estrutura legada;
- fabricantes podem ser consultados sem `status`/`notes`;
- clientes retornam lista vazia enquanto a tabela não existir;
- equipamentos de cliente não são simulados antes da Migration 014.

### Kits

Arquivo: [kits/service.ts](../../app/src/modules/kits/service.ts)

- listagem legada quando a relação `clients` ainda não existe;
- criação usa o mesmo helper de tenant;
- `/api/kits` deixou de retornar 400 por relação ausente.

### Cache e servidor local

- processos Next.js concorrentes foram encerrados;
- `.next` local foi removido e regenerado;
- um único `npm run dev` foi iniciado em `http://localhost:3000`.

## Páginas validadas

As páginas principais responderam HTTP 200:

- `/`;
- `/login`;
- `/dashboard`;
- `/equipamentos`;
- `/clientes`;
- `/fabricantes`;
- `/categorias`;
- `/inspecoes`;
- `/inspecoes/nova`;
- `/kits`;
- `/treinamentos`;
- `/auditorias`;
- `/contratos`;
- `/relatorios`;
- `/importacao`;
- `/sobre`.

A página `/equipamentos` foi aberta no navegador após o reinício limpo e apresentou layout, navegação, filtros e estado vazio sem erro 500.

## APIs validadas

Responderam HTTP 200 no contexto autenticado local:

- `/api/equipment`;
- `/api/clientes`;
- `/api/fabricantes`;
- `/api/categorias`;
- `/api/inspections`;
- `/api/kits`.

As demais rotas da aplicação já haviam respondido HTTP 200 na validação anterior.

## Autenticação e hidratação

- O middleware redireciona usuários sem sessão para `/login`;
- a sessão autenticada atual acessa `/dashboard` e `/equipamentos`;
- não foi observado erro de hidratação React após o reinício limpo;
- não foi observado erro 500 nas páginas principais;
- avisos de LCP da logo não bloqueiam a operação.

## Persistência

### Validado

- leitura autenticada de equipamentos, categorias, fabricantes e inspeções;
- contexto de tenant para usuário autenticado;
- fallback de leitura no schema anterior;
- caminho de gravação de equipamentos FP, fabricantes e kits usa `getAuthenticatedTenant`.

### Ainda não homologado ponta a ponta

Não foram inseridos dados fictícios para forçar uma homologação. Portanto, ainda não é possível declarar persistência real de:

- fabricante;
- cliente;
- equipamento;

O banco conectado ainda não possui a Migration 014. Consequentemente, o cadastro de clientes e o vínculo de equipamentos a clientes continuam bloqueados até a reconciliação/aplicação segura das migrations remotas.

## Validação técnica

Executados sequencialmente:

```powershell
npm run typecheck
npm run build
```

Resultados:

- `npm run typecheck`: **PASSOU**;
- `npm run build`: **PASSOU**;
- build com 48 páginas/rotas.

## Aderência operacional após estabilização

A estabilização removeu os bloqueios de carregamento, layout, tenant e consultas legadas. A aderência estimada permanece **51%**, pois a Migration 014 ainda não foi aplicada/reconciliada e os fluxos de persistência real não foram homologados com dados autorizados.

Não é tecnicamente correto elevar o percentual antes de validar:

1. cadastro real de fabricante;
2. cadastro real de cliente;
3. equipamento FP;
4. equipamento de cliente;
5. inspeção vinculada;
6. persistência e consulta após reload.

## Pendências bloqueantes antes da Sprint 3

- reconciliar as 13 versões timestamped existentes no histórico remoto;
- aplicar a Migration 014 somente após essa reconciliação;
- gerar tipos TypeScript a partir do schema efetivamente aplicado;
- executar homologação autenticada de fabricante, cliente e equipamento;
- validar persistência após logout/reload.

Nenhuma migration remota, publicação, commit ou push foi executado nesta auditoria.
