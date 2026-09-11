# FP Vault360° — Arquitetura Completa da Solução (Etapa 1)

**Empresa proprietária:** F P Soluções em Altura Ltda. — CNPJ 58.348.102/0001-82
**Produto:** FP Vault360°
**Tipo:** SaaS Multiempresa (Multi-Tenant)
**Documento:** Etapa 1 de 8 — Arquitetura completa para aprovação
**Data base:** Setembro/2026

> Conforme instrução do projeto, nenhum código será gerado antes da aprovação deste documento.

---

## 1. Identidade Visual Recebida

| Ativo | Uso |
|---|---|
| `FP_Vault360º_Final.png` | Logo principal do produto (versão ilustrada, cadeado + corda), aplicação em splash screen, login, capa de relatórios PDF |
| `FP-Vault360º-Final.svg` | Versão vetorial do logo do produto — usar no header da aplicação (escalável, ícone de PWA, favicon) |
| `_1_-_Fundo_Branco.png` | Logo institucional "FP Solução em Altura" — usar em rodapés, relatórios, e-mails, tela "Sobre" |

Paleta extraída: verde principal `#4F7A5C` / `#5C8A68` (tons de verde-oliva), fundo bege `#F0EDE4` / branco. Vou herdar essa paleta como base do design system (Tailwind + Shadcn), mantendo consistência com a identidade já usada no FP Operacional.

---

## 2. Stack Tecnológica (confirmada, não sujeita a reavaliação)

- **Frontend:** Next.js 14+ (App Router) · React 18 · TypeScript · Tailwind CSS · Shadcn UI
- **Backend/BaaS:** Supabase (Postgres, Auth, Storage, Edge Functions, Realtime)
- **Banco:** PostgreSQL com Row Level Security (RLS) obrigatório
- **Hospedagem:** Vercel (frontend) + Supabase Cloud (backend)
- **Mobile:** PWA (mobile-first, offline-first no módulo de inspeção)
- **Notificações:** E-mail (Resend/SMTP), WhatsApp Business API, Web Push
- **IA:** OpenAI API (assistente de inspeção, relatórios automáticos)
- **Relatórios:** Geração server-side em PDF (pdf-lib/React-PDF) e Excel (SheetJS)

---

## 3. Modelo Multi-Tenant

- Isolamento por `tenant_id` em **todas** as tabelas de negócio (obrigatório, sem exceção).
- RLS ativado em 100% das tabelas; toda policy filtra por `tenant_id = auth.jwt() -> tenant_id` (via claim customizada), exceto para o Super Master (ver §6).
- **Tenant Master:** F P Soluções em Altura — atua como tenant especial com visibilidade cruzada controlada (Modo Prestador de Serviço, §5).
- Cada tenant possui: schema lógico próprio (mesma base física, isolado por RLS), storage bucket segmentado por pasta `tenant_id/`, dashboard, relatórios e configurações próprias.
- Nenhuma query do frontend/API contorna RLS — nem policies de "service role" no cliente.

---

## 4. Hierarquia de Acesso (RBAC)

```
Nível 0 — Super Master (Founder)         → global, fora de qualquer tenant
Nível 1 — Administrador Global FP        → escopo: tenant master + tenants em modo Prestador
Nível 2 — Gestor de Cliente              → escopo: seu tenant
Nível 3 — Inspetor                       → escopo: seu tenant, módulo de inspeções
Nível 4 — Almoxarife                     → escopo: seu tenant, módulo de estoque/kits
Nível 5 — Usuário Operacional            → escopo: seu tenant, leitura + checklist pré-uso
```

Implementação: tabela `roles` + `permissions` + `role_permissions` (RBAC granular por módulo/ação), não apenas RBAC fixo por nível — permite customização futura por tenant sem alterar código.

---

## 5. Modelos Operacionais (multi-modo)

O mesmo schema e as mesmas APIs atendem três cenários simultaneamente, diferenciados por um campo `tenant.operation_mode`:

| Modo | Quem inspeciona | Quem administra | Acesso do cliente |
|---|---|---|---|
| **Prestador de Serviço FP** | FP | FP | Somente consulta/download |
| **Cliente Autônomo** | Próprio cliente | Próprio cliente | Total (dentro do seu tenant) |
| **Híbrido** | Ambos | Compartilhado | Total + trilha de auditoria separada por origem (`performed_by_org`) |

Contratos, escopos, SLA e faturamento ficam em módulo próprio (`contracts`), vinculando tenant ↔ FP.

---

## 6. Super Master (Founder Account)

- Entidade especial, **não vinculada a nenhum `tenant_id`** (campo nulo + flag `is_super_master`).
- Criado no primeiro deploy via variáveis de ambiente (`MASTER_EMAIL`, `MASTER_PASSWORD`), nunca hardcoded, nunca logado.
- Unicidade garantida por constraint de banco (`UNIQUE WHERE is_super_master = true`, via índice parcial) + trigger de validação.
- Todas as ações do Super Master gravadas em `audit_log` imutável (sem UPDATE/DELETE permitido — apenas INSERT, reforçado por policy e por trigger `BEFORE DELETE/UPDATE RAISE EXCEPTION`).
- Transferência de titularidade: fluxo transacional (`transfer_super_master()` function) com reautenticação, log de auditoria e revogação atômica do papel anterior.
- Proteção: nenhuma policy permite que outro usuário altere/exclua o registro do Super Master.

---

## 7. Módulo 0 — Migração & Onboarding

- Wizard de 5 etapas (upload → validação → mapeamento inteligente → pré-visualização → importação definitiva).
- Motor de mapeamento: tabela `import_layouts` salva por tenant (aprende "planilha SAP", "planilha TOTVS", etc.) com dicionário de sinônimos de campo (`Fabricante` → `manufacturer`).
- Processamento assíncrono via fila (Supabase Edge Function + tabela `import_jobs` como fila, ou pg_cron/worker), com rollback transacional por lote e log completo.
- Metas de volume (50k equipamentos / 5k kits / 10k usuários) atendidas via processamento em chunks + streaming, não em uma única transação monolítica.
- Onboarding automático de novo tenant: função `provision_new_tenant()` cria estrutura padrão (almoxarifado, categorias, checklists, dashboard) em uma única transação.

---

## 8. Domínio de Dados — Entidades Principais

Grupos de tabelas (nomes definitivos serão detalhados na Etapa 2 — Banco de Dados):

- **Identidade/Tenant:** `tenants`, `users`, `roles`, `permissions`, `role_permissions`, `user_roles`
- **Inventário:** `equipment`, `equipment_categories`, `manufacturers`, `equipment_documents`, `equipment_photos`
- **Rastreabilidade:** `equipment_codes` (QR/DataMatrix/NFC/barcode)
- **Inspeções:** `inspections`, `inspection_checklists`, `checklist_templates`, `checklist_items`, `inspection_evidences`, `inspection_signatures`
- **Cordas:** `rope_details`, `rope_cuts`, `rope_usage_history`
- **Kits:** `kits`, `kit_items`
- **Treinamentos:** `trainings`, `certifications`, `user_certifications`
- **Auditoria:** `audits`, `nonconformities`, `action_plans`, `audit_log` (log geral do sistema)
- **Documentos:** `documents`, `document_versions`
- **Alertas:** `notifications`, `notification_rules`
- **Contratos:** `contracts`, `contract_scopes`
- **BI/Relatórios:** views materializadas + funções SQL (`v_compliance_rate`, `v_expiring_equipment`, etc.) — dashboards nunca calculam agregados pesados no frontend
- **Importação:** `import_jobs`, `import_layouts`, `import_errors`
- **Configuração da plataforma:** `platform_settings` (nome da empresa, nome do produto — editáveis apenas pelo Super Master, sem indicar essa exclusividade na UI)

Todas as tabelas de negócio: `id UUID`, `tenant_id UUID`, `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at` (soft delete).

---

## 9. Página "Sobre o FP Vault360°"

Conteúdo visível ao usuário:

```
FP Vault360°
Versão: 1.0
Status: Ativo
Empresa: F P Soluções em Altura Ltda.
Produto: FP Vault360°
Tipo: SaaS Multiempresa (Multi-Tenant)
Data Base: Setembro/2026
```

Regras de implementação:
- "Empresa" e "Produto" vêm de `platform_settings`, editáveis **apenas** pelo Super Master, via rota protegida sem entrada visível no menu padrão (acessível somente dentro do painel exclusivo dele — não aparece como opção para outros níveis, nem mesmo Nível 1).
- **Versionamento automático:** a cada deploy/atualização de qualquer sistema associado, incrementar a versão alternando os sufixos `.2` e `.3` (ex.: 1.0 → 1.2 → 1.3 → 2.2 → 2.3 ...). Vou implementar isso como função de versionamento (`bump_version()`) acionada no pipeline de release, armazenando o histórico em `version_history`.
- Autoria ("Luiz Felipe dos Santos Ferreira") registrada apenas nos metadados internos do sistema — **não exibida no frontend**, conforme sua observação de que tudo entre parênteses é interno.

---

## 10. Marca d'água padrão

Em todas as páginas, canto inferior esquerdo, discreta (baixa opacidade, fonte pequena, não interativa):

```
Criado por Luiz Felipe Ferreira em 09/2026
```

Implementado como componente global de layout (`<AppWatermark />`), fixo, `pointer-events: none`, para nunca interferir em cliques.

---

## 11. Padrão de Projeto

```
src/
  modules/          → feature-based (equipment, inspections, ropes, kits, training, audit, bi, imports, contracts, platform)
  shared/
    components/
    services/
    hooks/
    types/
    lib/
```

Ordem obrigatória de construção por módulo: **Modelo → Banco → API → Interface** (nunca invertida).
Checklists de inspeção: 100% configuráveis via banco (`checklist_templates`/`checklist_items`), nunca hardcoded.

---

## 12. Roadmap de Sprints (confirmado)

| Sprint | Entrega |
|---|---|
| 1 | Fundação: tenant, usuários, perfis, permissões, login, dashboard básico |
| 2 | Inventário: equipamentos, categorias, fabricantes, uploads, QR Code |
| 3 | Importação: XLSX/CSV, kits, migração |
| 4 | Inspeções: checklists, evidências, assinaturas, histórico |
| 5 | Gestão de Cordas: comprimento, cortes, desgaste |
| 6 | Treinamentos: certificações, vencimentos |
| 7 | Auditoria: não conformidades, planos de ação |
| 8 | BI: dashboards, indicadores, relatórios |
| 9 | Portal do Cliente: acesso externo, compartilhamento |
| 10 | IA: assistente de inspeção, relatórios automáticos, análise de conformidade |
| 11 | Mobile PWA: operação offline, sincronização |
| 12 | Produção: Vercel, Supabase, monitoramento, backup |

---

## 13. Limitação de ambiente (importante)

Este ambiente de chat não tem acesso à internet nem a credenciais reais de Supabase/Vercel. Nesta e nas próximas etapas eu vou entregar:

- Schema SQL completo (migrations) + policies RLS — prontos para rodar no seu projeto Supabase.
- Código do frontend/backend completo (Next.js + Supabase client).
- Documentação técnica, Swagger, diagramas ER.

O provisionamento real (criar projeto Supabase, rodar migrations, configurar variáveis de ambiente, deploy Vercel) precisa acontecer no seu lado — posso te guiar passo a passo, ou você pode levar os arquivos para o Claude Code, que tem acesso à sua máquina/rede.

---

## Próximo passo

Com esta arquitetura aprovada, a **Etapa 2** será o Banco de Dados completo: diagrama ER, todas as tabelas, chaves, relações e políticas RLS detalhadas.

**Você aprova esta arquitetura para eu seguir para a Etapa 2?** Se quiser ajustar algo (nomenclatura de tabelas, paleta, algum módulo), me diga agora antes de eu gerar o schema.
