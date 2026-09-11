# FP Vault360° — Etapa 7: Documentação Técnica

## Módulo: Equipamentos (implementado nesta entrega — referência de padrão)

| Item | Detalhe |
|---|---|
| Tabelas | `equipment`, `equipment_categories`, `manufacturers`, `equipment_codes`, `equipment_photos`, `cost_centers`, `locations` |
| APIs | `GET/POST /api/equipment`, `GET/PATCH/DELETE /api/equipment/[id]` |
| Fluxos | Cadastro → vínculo a categoria/fabricante/localização → geração de código de rastreio → inspeções associadas → cálculo automático de `expiration_date` |
| Dependências | RLS (`007_rls_policies.sql`), RBAC (`equipment:*` em `permissions`) |
| Regras de negócio | Serial único por tenant; soft delete; status derivado manualmente (ativo/quarentena/bloqueado/aposentado/extraviado) |

## Módulo: Inspeções (implementado nesta entrega)

| Item | Detalhe |
|---|---|
| Tabelas | `inspections`, `inspection_items_result`, `inspection_evidences`, `inspection_signatures`, `checklist_templates`, `checklist_items` |
| APIs | `GET/POST /api/inspections`, `GET /api/inspections/templates/[id]` |
| UI | `/inspecoes` (listagem), `/inspecoes/nova?equipmentId=&templateId=` (execução do checklist dinâmico) |
| Fluxos | Selecionar equipamento → carregar template da categoria → marcar cada item (OK/NOK/NA) → item crítico NOK reprova a inspeção automaticamente (trigger no banco, não duplicado no frontend) → observações + evidências |
| Componente-chave | `modules/inspections/components/ChecklistForm.tsx` — renderiza os itens dinamicamente a partir do banco, nunca hardcoded |

## Módulo: Gestão de Cordas (implementado nesta entrega)

| Item | Detalhe |
|---|---|
| Tabelas | `rope_details`, `rope_cuts`, `rope_usage_history` |
| APIs | `GET /api/ropes/[equipmentId]`, `POST /api/ropes/cuts` |
| UI | `/cordas` (listagem com desgaste calculado) |
| Fluxos | Registro de corte → trigger `fn_apply_rope_cut()` atualiza `current_length_m` e grava em `rope_usage_history` automaticamente → `wear_percent` recalculado via coluna gerada → aposentadoria manual (`retireRope`) atualiza corda + status do equipamento |

## Demais módulos (schema completo nas migrations; API/UI a implementar seguindo o mesmo padrão)

Todos seguem exatamente a mesma arquitetura em camadas (`modules/<nome>/{types,service}.ts` → `app/api/<nome>/route.ts` → `app/(dashboard)/<nome>/page.tsx`):

- **Kits** — status do kit recalculado automaticamente pelo pior status dos componentes (trigger `fn_recalc_kit_status`).
- **Treinamentos** — status calculado (`valid`/`expiring_soon`/`expired`) via coluna gerada em `user_certifications`.
- **Auditoria** — `audits` → `nonconformities` → `action_plans`, com trilha completa em `audit_log`.
- **Importação** — `import_layouts` (motor de mapeamento reutilizável), `import_jobs`/`import_errors` (fila + rollback).
- **BI/Relatórios** — 4 views SQL prontas (`v_equipment_summary`, `v_compliance_rate`, `v_training_status`, `v_fp_operations_summary`); frontend apenas consome, nunca agrega.
- **Contratos** — vínculo FP ↔ cliente, com visibilidade cruzada controlada via RLS.

## API — Padrão REST
- Autenticação: JWT via Supabase Auth (cookie de sessão, renovado pelo `middleware.ts`).
- Toda mutação relevante chama `log_audit()` (função SQL) para trilha de auditoria.
- Validação de entrada com Zod em toda rota (`app/api/**/route.ts`).
- Convenção de resposta: `{ data }` em sucesso, `{ error }` em falha, HTTP status semântico (400/401/403/404/422).

## Documentação Swagger/OpenAPI
Recomenda-se gerar automaticamente a partir dos schemas Zod (ex.: `zod-to-openapi`), mantendo uma única fonte de verdade para validação e documentação. Estrutura sugerida: `docs/openapi.yaml` gerado em CI a cada PR que altera `app/api/**`.

## Estrutura do módulo (padrão de documentação por entrega)
Para cada módulo entregue, manter neste diretório: estrutura de pastas, tabelas utilizadas, endpoints, fluxos e dependências — exatamente como descrito acima para o módulo de Equipamentos, replicado a cada sprint concluída.
