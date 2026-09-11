# FP Vault360° — Etapa 2: Banco de Dados Completo

9 migrations SQL, prontas para `supabase db push` ou execução sequencial no SQL Editor:

| Arquivo | Conteúdo |
|---|---|
| `001_core.sql` | Extensões, enums, `tenants`, `platform_settings`, `version_history`, `users`, RBAC (`roles`/`permissions`/`role_permissions`/`user_roles`), `audit_log` imutável, seed dos 6 papéis padrão |
| `002_inventory.sql` | `manufacturers`, `equipment_categories`, `cost_centers`, `locations`, `equipment` (com `expiration_date` calculada), `equipment_codes` (QR/DataMatrix/NFC/barcode), `equipment_photos`, `documents`/`document_versions` |
| `003_inspections.sql` | `checklist_templates`/`checklist_items` (100% configurável via banco), `inspections`, `inspection_items_result`, evidências, assinaturas, trigger de reprovação automática por item crítico |
| `004_ropes_kits.sql` | `rope_details` (desgaste calculado), `rope_cuts` (trigger que atualiza comprimento), `rope_usage_history`, `kits`/`kit_items` (status derivado automaticamente do pior componente) |
| `005_training_audit.sql` | `certifications`, `trainings`, `user_certifications` (status calculado: válido/vencendo/vencido), `audits`, `nonconformities`, `action_plans` |
| `006_import_contracts_bi.sql` | `import_layouts` (motor de aprendizado de mapeamento), `import_jobs`/`import_errors`, `contracts`/`contract_scopes` (FP ↔ cliente), `notification_rules`/`notifications`, **4 views de BI** (`v_equipment_summary`, `v_compliance_rate`, `v_training_status`, `v_fp_operations_summary`) |
| `007_rls_policies.sql` | RLS habilitado em todas as tabelas de negócio. Funções auxiliares `fn_current_user_tenant()`, `fn_is_super_master()`, `fn_has_permission()`. Isolamento por tenant + visibilidade cruzada da FP via `contracts` (modo prestador/híbrido) + proteção especial do registro do Super Master |
| `008_admin_functions.sql` | `provision_new_tenant()` (onboarding atômico), `transfer_super_master()`, `bump_version()` (alterna .2/.3 conforme solicitado), `update_platform_identity()` (edição oculta de Empresa/Produto), `log_audit()` |
| `009_permissions_seed.sql` | Seed de permissões por módulo e vínculo com cada papel da hierarquia |

## Diagrama ER (visão macro)

```
tenants ──┬─< users ──< user_roles >── roles ──< role_permissions >── permissions
          ├─< equipment_categories ──< equipment >──┬─< equipment_codes
          │                                          ├─< equipment_photos
          │                                          ├─< rope_details (1:1)
          │                                          └─< inspections ──┬─< inspection_items_result
          ├─< kits ──< kit_items >── equipment                          ├─< inspection_evidences
          ├─< checklist_templates ──< checklist_items                   └─< inspection_signatures
          ├─< user_certifications >── certifications
          ├─< audits ──< nonconformities ──< action_plans
          ├─< import_jobs ──< import_errors
          ├─< contracts (fp_tenant_id / client_tenant_id) ──< contract_scopes
          └─< audit_log (imutável)
```

## Regras estruturais aplicadas
- UUID em 100% das tabelas · `tenant_id` obrigatório em toda entidade de negócio · Soft delete (`deleted_at`) · `created_at`/`updated_at`/`created_by`/`updated_by` padronizados.
- Nenhum checklist hardcoded — administrado 100% via `checklist_templates`/`checklist_items`.
- Indicadores de dashboard alimentados por views SQL, não por cálculo no frontend.
- Super Master: unicidade garantida por índice parcial, sem `tenant_id`, protegido contra alteração por terceiros via policy dedicada.
