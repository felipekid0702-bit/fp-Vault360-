# FP Vault360° — Etapa 8: Plano Comercial SaaS

## Modelos de receita (suportados nativamente pela arquitetura)

### 1. Prestador de Serviço FP
FP vende o **serviço de gestão + inspeção**, usando a plataforma como ferramenta interna. Receita recorrente via contrato (`contracts`), com escopo, SLA e frequência de inspeção definidos por cliente.

**Sugestão de precificação:** por equipamento sob gestão/mês + taxa de inspeção avulsa para eventos extraordinários.

### 2. Cliente Autônomo (Licenciamento SaaS puro)
FP vende apenas o **acesso à plataforma**; o cliente opera sozinho.

**Estrutura de planos sugerida:**

| Plano | Equipamentos | Usuários | Módulos | Indicado para |
|---|---|---|---|---|
| Starter | até 200 | até 5 | Inventário, Inspeções, Alertas | Pequenas empresas |
| Professional | até 2.000 | até 25 | + Kits, Treinamentos, BI básico | Empresas médias |
| Enterprise | ilimitado | ilimitado | Todos + IA, API, Multi-unidade | Grandes contas/industriais |

Cobrança combinável por: nº de equipamentos, nº de usuários, nº de unidades, módulos contratados — todos já modelados em `platform_settings`/estrutura de tenant, prontos para regra de billing.

### 3. Híbrido
Mensalidade base (acesso à plataforma) + serviços pontuais da FP (auditoria anual, inspeção especializada, consultoria) faturados via mesma estrutura de `contracts`.

## Métricas de negócio a expor no dashboard da FP (já modeladas em `v_fp_operations_summary`)
- Total de clientes atendidos · Equipamentos sob gestão · Contratos ativos · Receita recorrente/prevista (a integrar com gateway de cobrança).

## Próximos passos comerciais (fora do escopo técnico desta entrega)
- Definir gateway de pagamento (Stripe recomendado, com webhook alimentando `tenants.status`).
- Definir política de trial (ex.: 14 dias, já suportado por `tenant_status = 'trial'`).
- Definir upsell entre planos (upgrade automático ao atingir limite de equipamentos/usuários).
