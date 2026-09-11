# Diagnóstico Técnico — Sprint 03

**Data:** 11/09/2026  
**Ambiente:** local, `http://localhost:3000`  
**Escopo:** estabilização operacional sem deploy, push ou migration remota.

## Varredura executada

- `npm run typecheck`;
- `npm run build`;
- navegação das páginas principais;
- chamadas autenticadas das APIs operacionais;
- inspeção dos logs do Next.js;
- inspeção do middleware, sessão Supabase e propagação de tenant;
- inspeção das consultas de equipamentos, kits, inspeções e evidências.

## Erros encontrados e causas

### Usuário sem tenant

**Causa:** o Super Master possui `users.tenant_id = NULL` por regra de schema, mas os services exigiam sempre um `tenant_id`.

**Correção:** o helper de tenant agora resolve o tenant marcado como `is_master` para o Super Master. Usuários comuns continuam obrigados a possuir vínculo explícito.

### Relações ausentes antes da Migration 014

**Causa:** o banco conectado ainda não possui `clients`, `equipment.owner_type`, `equipment.client_id`, `kits.client_id` e `manufacturers.status`.

**Correção:** foram adicionados fallbacks de leitura para equipamentos, fabricantes, clientes, kits e alvos de inspeção. Esses fallbacks não simulam equipamentos de cliente e registram a condição no console administrativo.

### Evidências exigindo tenant direto

**Causa:** o upload de evidências e assinaturas usava somente `users.tenant_id`, quebrando para Super Master.

**Correção:** a rota passou a usar `getAuthenticatedTenant`.

### Cache/chunks do Next.js

**Causa:** concorrência entre `npm run dev` e `npm run build` usando `.next`.

**Correção:** processos duplicados foram encerrados, `.next` foi regenerado e um único servidor dev foi mantido.

## Correções realizadas

- [tenant.ts](../../app/src/shared/lib/supabase/tenant.ts): resolução do tenant master;
- [bootstrap/route.ts](../../app/src/app/api/admin/bootstrap/route.ts): garantia estrutural do tenant master durante bootstrap autorizado;
- [equipment/service.ts](../../app/src/modules/equipment/service.ts): fallback legado;
- [inventory/service.ts](../../app/src/modules/inventory/service.ts): fallback legado;
- [kits/service.ts](../../app/src/modules/kits/service.ts): fallback legado e tenant uniforme;
- [inspections/service.ts](../../app/src/modules/inspections/service.ts): fallback de alvos sem relação `clients`;
- [evidencias/route.ts](../../app/src/app/api/inspections/[inspectionId]/evidencias/route.ts): tenant uniforme no upload.

## Páginas validadas

As rotas principais carregaram com HTTP 200 e layout:

`/`, `/login`, `/dashboard`, `/equipamentos`, `/clientes`, `/fabricantes`, `/categorias`, `/inspecoes`, `/inspecoes/nova`, `/kits`, `/treinamentos`, `/auditorias`, `/contratos`, `/relatorios`, `/importacao`, `/sobre`.

## APIs validadas

Responderam sem HTTP 500 no contexto autenticado:

`/api/equipment`, `/api/clientes`, `/api/fabricantes`, `/api/categorias`, `/api/inspections`, `/api/kits`.

## Hidratação, CSS e autenticação

- não foi observado erro de hidratação React após reinício limpo;
- layout e sidebar carregaram;
- login e middleware redirecionam conforme sessão;
- não foram observados erros 500 nas páginas principais;
- avisos de LCP da logo são não bloqueantes.

## Estado de persistência

O caminho de persistência está corrigido para equipamentos, fabricantes, clientes e kits, usando tenant autenticado. A persistência real de clientes e equipamentos de cliente não pode ser homologada enquanto a Migration 014 não estiver no banco.

Não foram criados dados fictícios nem executadas migrations remotas.

## Validação técnica

```text
npm run typecheck  PASSOU
npm run build      PASSOU
```

O build gerou 48 páginas/rotas.

## Bloqueios externos restantes

1. Reconciliar as 13 versões timestamped já existentes no histórico remoto;
2. aplicar a Migration 014 somente depois da reconciliação;
3. homologar persistência real com dados autorizados;
4. validar upload Storage com bucket e policies efetivamente disponíveis;
5. validar assinatura gráfica e exportações em ambiente com banco/schema completo.
