# Auditoria Completa de `supabase/migrations`

**Data:** 11/09/2026  
**Escopo:** ordem, objetos, dependências e validação da migration 014.  
**Execução remota:** não realizada.

## Limitação de validação SQL

Foi tentado:

```powershell
npx supabase db lint --local
```

O comando não conseguiu conectar ao PostgreSQL local porque não há banco Supabase local escutando em `127.0.0.1:54322`. Portanto, a sintaxe foi revisada estaticamente, mas não foi executada por PostgreSQL nesta sessão.

## Migrations em ordem cronológica

### 001 — `001_core.sql`

**Cria tabelas:**

- `tenants`;
- `platform_settings`;
- `version_history`;
- `users`;
- `roles`;
- `permissions`;
- `role_permissions`;
- `user_roles`;
- `audit_log`.

**Cria enums:** `operation_mode`, `tenant_status`, `equipment_status`, `inspection_type`, `inspection_result`, `notification_channel`.

**Colunas/regras relevantes:**

- núcleo de tenants;
- usuários e vínculo com tenant;
- Super Master;
- RBAC;
- auditoria;
- constraints de Super Master sem tenant;
- seeds iniciais de roles.

**Policies:** nenhuma.

**Triggers:**

- `trg_audit_log_no_update`;
- `trg_audit_log_no_delete`;
- `trg_tenants_updated_at`;
- `trg_users_updated_at`.

**Dependências:** extensões `uuid-ossp` e `pgcrypto`; nenhuma migration anterior.

### 002 — `002_inventory.sql`

**Cria tabelas:**

- `manufacturers`;
- `equipment_categories`;
- `cost_centers`;
- `locations`;
- `equipment`;
- `equipment_codes`;
- `equipment_photos`;
- `documents`;
- `document_versions`.

**Colunas relevantes em `equipment`:**

- categoria;
- fabricante;
- centro de custo;
- localização;
- código interno;
- número de série;
- modelo;
- datas de fabricação, aquisição e primeiro uso;
- vida útil;
- validade gerada;
- certificação;
- CA;
- normas;
- status;
- observações;
- auditoria de criação/alteração e exclusão lógica.

**Policies:** nenhuma.

**Triggers:**

- `trg_equipment_updated_at`.

**Dependências:** 001 (`tenants`, enums e usuários).

### 003 — `003_inspections.sql`

**Cria tabelas:**

- `checklist_templates`;
- `checklist_items`;
- `inspections`;
- `inspection_items_result`;
- `inspection_evidences`;
- `inspection_signatures`.

**Altera:**

- adiciona FK de `equipment_categories.checklist_template_id` para `checklist_templates`.

**Colunas relevantes:**

- templates por categoria;
- itens ordenados e críticos;
- inspeção ligada a equipamento, usuário, template e tipo;
- resultado, observações e vencimento;
- resultados por item;
- caminhos de evidência;
- assinaturas.

**Policies:** nenhuma.

**Triggers/functions:**

- `trg_inspections_updated_at`;
- `fn_apply_inspection_result`;
- `trg_inspection_item_result`.

**Dependências:** 001 e 002.

### 004 — `004_ropes_kits.sql`

**Cria tabelas:**

- `rope_details`;
- `rope_cuts`;
- `rope_usage_history`;
- `kits`;
- `kit_items`.

**Colunas adicionadas posteriormente:** nenhuma em relação ao schema já criado no arquivo, mas adiciona FK `inspections.kit_id → kits.id`.

**Policies:** nenhuma.

**Triggers/functions:**

- `fn_apply_rope_cut`;
- `trg_rope_cut`;
- `fn_recalc_kit_status`;
- `fn_trigger_kit_status`;
- `trg_kit_items_status`;
- `trg_kits_updated_at`.

**Dependências:** 001, 002 e 003.

### 005 — `005_training_audit.sql`

**Cria tabelas:**

- `certifications`;
- `trainings`;
- `user_certifications`;
- `audits`;
- `nonconformities`;
- `action_plans`.

**Policies:** nenhuma.

**Triggers/functions:**

- `fn_set_user_certification_status`;
- `trg_user_certification_status`;
- `trg_audits_updated_at`.

**Dependências:** 001, 002 e documentos de 002.

### 006 — `006_import_contracts_bi.sql`

**Cria tabelas:**

- `import_layouts`;
- `import_jobs`;
- `import_errors`;
- `contracts`;
- `contract_scopes`;
- `notification_rules`;
- `notifications`.

**Views:**

- `v_equipment_summary`;
- `v_compliance_rate`;
- `v_training_status`;
- `v_fp_operations_summary`.

**Policies:** nenhuma.

**Triggers:**

- `trg_contracts_updated_at`.

**Dependências:** 001, 002, 003 e 005.

### 007 — `007_rls_policies.sql`

**Tabelas alteradas:** habilita RLS nas tabelas de negócio criadas até então.

**Functions:**

- `fn_current_user_tenant`;
- `fn_is_super_master`;
- `fn_has_permission`.

**Policies:**

- tenants;
- users;
- roles;
- user_roles;
- manufacturers;
- categorias;
- custos;
- locais;
- equipamentos;
- códigos;
- fotos;
- documentos;
- templates;
- inspeções;
- itens de inspeção;
- evidências;
- assinaturas;
- cordas;
- kits;
- certificações;
- treinamentos;
- auditorias;
- não conformidades;
- importações;
- contratos;
- notificações;
- `audit_log`.

Inclui policies específicas de visibilidade da FP sobre tenants clientes vinculados por contratos.

**Triggers:** nenhum.

**Dependências:** 001 a 006.

### 008 — `008_admin_functions.sql`

**Tabelas alteradas:** nenhuma diretamente.

**Functions:**

- `provision_new_tenant`;
- `transfer_super_master`;
- `bump_version`;
- `update_platform_identity`;
- `log_audit`.

**Policies:** nenhuma.

**Triggers:** nenhum.

**Dependências:** 001, 002, 007 e tabelas de contratos/roles.

### 009 — `009_permissions_seed.sql`

**Tabelas alteradas:**

- `permissions`;
- `role_permissions`.

**Colunas alteradas:** nenhuma.

**Policies:** nenhuma.

**Triggers:** nenhum.

**Dependências:** 001 e 007/008 para roles e funções de autorização.

### 010 — `010_fp_inspection_model.sql`

**Tabelas alteradas:**

- `checklist_templates`;
- `checklist_items`;
- `inspection_items_result`;
- `inspections`.

**Colunas adicionadas:**

- `checklist_templates.template_code`;
- `checklist_templates.objective`;
- `checklist_templates.source_document`;
- `checklist_items.section`;
- `checklist_items.required`;
- `checklist_items.evidence_required`;
- `inspection_items_result.classification`;
- `inspection_items_result.action_required`;
- `inspections.history_notes`;
- `inspections.inspection_location`;
- `inspections.verdict`.

**Triggers/functions:**

- substitui `fn_apply_inspection_result`;
- mantém a aplicação automática de resultado e veredito.

**Policies:** nenhuma nova.

**Dependências:** 003 e 007.

### 011 — `011_fp_inspection_templates_complete.sql`

**Tabelas alteradas:**

- `inspections`;
- `checklist_items` via inserts de catálogo.

**Colunas adicionadas:**

- `inspections.history_fall`;
- `inspections.history_chemical_or_abrasive`;
- `inspections.history_temperature_out_of_range`;
- `inspections.history_unauthorized_modification`.

**Triggers/functions:**

- substitui novamente `fn_apply_inspection_result`;
- incorpora gatilhos históricos, `AR/R` e `AV`.

**Policies:** nenhuma nova.

**Dependências:** 003, 007 e 010.

### 012 — `012_fp_operational_lifecycle.sql`

**Cria tabelas:**

- `equipment_movements`;
- `maintenance_records`;
- `quarantine_cases`;
- `disposal_records`;
- `inspection_reports`;
- `competency_catalog`;
- `user_competencies`.

**Altera `user_certifications`:**

- `issued_by`;
- `renewal_of`;
- `document_path`.

**Views:**

- `v_fp_traceability`;
- `v_fp_executive_summary`.

**Triggers/functions:**

- `fn_set_user_competency_status`;
- `trg_user_competency_status`;
- `fn_open_quarantine_after_inspection`;
- `trg_open_quarantine_after_inspection`.

**Policies:** policies tenant-isolation para:

- `equipment_movements`;
- `maintenance_records`;
- `quarantine_cases`;
- `disposal_records`;
- `inspection_reports`;
- `user_competencies`.

**Dependências:** 001, 002, 003, 005 e 007.

### 013 — `013_fp_evidence_linkage.sql`

**Tabelas alteradas:**

- `inspection_evidences`;
- `inspection_reports`;
- `equipment`.

**Colunas adicionadas:**

- `inspection_evidences.checklist_item_id`;
- `inspection_reports.document_hash`.

**Triggers/functions:**

- `fn_record_equipment_status_movement`;
- `trg_record_equipment_status_movement`.

**Policies:** nenhuma nova.

**Dependências:** 002, 003, 007 e 012.

### 014 — `014_fp_operational_structure.sql`

**Cria:**

- enum `equipment_owner_type`;
- enum `catalog_record_status`;
- tabela `clients`.

**Colunas adicionadas:**

- `manufacturers.status`;
- `manufacturers.notes`;
- `equipment.owner_type`;
- `equipment.client_id`;
- `kits.client_id`;
- `kits.description`.

**Índices:**

- unicidade de CNPJ de cliente por tenant;
- unicidade de nome de cliente por tenant;
- unicidade de nome de fabricante por tenant;
- índices de cliente/proprietário em equipamentos;
- índice de cliente em kits.

**Constraints/FKs:**

- `equipment.client_id → clients.id`;
- `kits.client_id → clients.id`;
- `equipment.owner_type/client_id` com regra FP/cliente;
- validação de tenant para cliente em equipamentos e kits.

**Policies:**

- `clients_tenant_access`.

**Triggers/functions:**

- `trg_clients_updated_at`;
- `trg_manufacturers_updated_at`;
- `fn_validate_client_tenant_link`;
- `trg_equipment_client_tenant`;
- `trg_kits_client_tenant`.

**Dependências:** 001, 002, 004, 007 e 008.

## Matriz de migrations

| Migration | Dependências | Obrigatória | Status no código |
|---|---|---:|---|
| 001 | extensões PostgreSQL | Sim | Presente |
| 002 | 001 | Sim | Presente |
| 003 | 001, 002 | Sim | Presente |
| 004 | 001, 002, 003 | Sim | Presente |
| 005 | 001, 002 | Sim | Presente |
| 006 | 001–005 | Sim para módulos correspondentes | Presente |
| 007 | 001–006 | Sim para RLS | Presente |
| 008 | 001, 002, 006, 007 | Sim para funções administrativas | Presente |
| 009 | 001, 007, 008 | Sim para seed de permissões | Presente |
| 010 | 003, 007 | Sim para motor FP | Presente |
| 011 | 003, 007, 010 | Sim para catálogo FP completo | Presente |
| 012 | 001–007, principalmente 002/003/005 | Sim para ciclo operacional FP | Presente |
| 013 | 002, 003, 007, 012 | Sim para evidências/hash/movimentação | Presente |
| 014 | 001, 002, 004, 007, 008 | Sim para clientes/propriedade | Presente e corrigida nesta auditoria |

## Requisitos específicos solicitados

| Requisito | Migration | Existe migration posterior dependente? |
|---|---|---|
| `manufacturers.status` | 014 | Não |
| `manufacturers.notes` | 014 | Não |
| `clients` | 014 | Não |
| `equipment.owner_type` | 014 | Não |
| `equipment.client_id` | 014 | Não |

A migration 014 é a última migration existente. Portanto, não há migration posterior que dependa formalmente dela.

As dependências posteriores no **código da aplicação** existem: services, APIs e páginas da Sprint 2 consultam essas colunas e a tabela `clients`. Isso explica o erro real observado em `/equipamentos` enquanto a 014 não é aplicada.

## Auditoria integral da Migration 014

### Problemas encontrados na versão original

1. `ADD CONSTRAINT` não era protegido contra reexecução.
2. A policy de clientes não contemplava `fn_is_super_master()`.
3. Não havia validação de tenant entre `equipment.client_id`/`kits.client_id` e `clients.tenant_id`.
4. Não havia trigger `updated_at` para `clients`.
5. Não havia trigger `updated_at` para `manufacturers`, apesar da alteração estrutural.
6. A validação SQL não podia ser executada localmente por ausência do PostgreSQL local.

### Correções aplicadas

- constraint protegida por bloco `DO ... EXCEPTION`;
- policy de clientes protegida contra duplicidade e com bypass de Super Master;
- trigger de integridade de tenant para equipamentos e kits;
- triggers de atualização automática de clientes e fabricantes;
- preservada a foreign key de cliente;
- preservados índices, enums, defaults e regras de proprietário.

## Parecer

### APROVADA

A versão corrigida da migration 014 está **APROVADA na revisão estática de estrutura, dependências, constraints, FKs, índices, RLS e triggers**.

A aprovação não equivale a execução validada: o PostgreSQL local não está disponível e a migration não foi aplicada ao Supabase remoto. Antes da aplicação produtiva, deve ser executado:

```powershell
npx supabase db lint --linked
npx supabase db push --linked
```

em ambiente autorizado/homologação, após confirmar duplicidades existentes em nomes de fabricantes/clientes e a existência dos tenants esperados.

## Estado final

- Nenhuma migration foi aplicada.
- Nenhum dado foi alterado no Supabase remoto.
- Nenhum commit foi executado.
- Nenhum push foi executado.

## Homologação remota — bloqueio identificado

O projeto Supabase vinculado é `lfghfsgcopnqiwtbgfhn`. A listagem remota mostrou:

- migrations locais `001` a `009` correspondem às versões remotas `001` a `009`;
- migrations locais `010` a `014` ainda não aparecem no histórico remoto;
- existem 13 versões remotas adicionais, timestamped, sem arquivo correspondente na pasta local:
  `20260911020300`, `20260911020936`, `20260911021006`, `20260911021021`,
  `20260911021126`, `20260911021145`, `20260911021212`, `20260911021227`,
  `20260911021241`, `20260911021257`, `20260911022041`, `20260911022105`,
  `20260911022138`.

O comando seguro:

```powershell
npx supabase db push --linked --dry-run
```

foi bloqueado pelo CLI com `Remote migration versions not found in local migrations directory`.

Não foi usado `--include-all`, `migration repair` ou `db pull`, pois essas opções poderiam aplicar migrations fora da sequência local ou alterar o histórico/schema local sem confirmação. A Migration 014 permanece pronta, mas sua aplicação exige primeiro reconciliar esse histórico divergente.
