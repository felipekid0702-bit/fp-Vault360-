-- Financial indicators (Módulo 12) need a monetary value per equipment item, which doesn't
-- exist yet. Adding as nullable so it doesn't break any existing import/insert flow.
ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS acquisition_value numeric(12,2),
  ADD COLUMN IF NOT EXISTS replacement_value numeric(12,2);

COMMENT ON COLUMN public.equipment.acquisition_value IS 'Valor pago na aquisição do item, usado nos indicadores financeiros do Módulo 12.';
COMMENT ON COLUMN public.equipment.replacement_value IS 'Custo estimado de reposição atual do item; usa acquisition_value como fallback quando nulo.';

-- Inventário: quantidade por categoria / fabricante / centro de custo / unidade
CREATE OR REPLACE VIEW public.v_equipment_by_category AS
SELECT e.tenant_id, c.id AS category_id, c.name AS category_name, count(*) AS total
FROM public.equipment e
JOIN public.equipment_categories c ON c.id = e.category_id
WHERE e.deleted_at IS NULL
GROUP BY e.tenant_id, c.id, c.name;

CREATE OR REPLACE VIEW public.v_equipment_by_manufacturer AS
SELECT e.tenant_id, m.id AS manufacturer_id, m.name AS manufacturer_name, count(*) AS total
FROM public.equipment e
JOIN public.manufacturers m ON m.id = e.manufacturer_id
WHERE e.deleted_at IS NULL
GROUP BY e.tenant_id, m.id, m.name;

CREATE OR REPLACE VIEW public.v_equipment_by_cost_center AS
SELECT e.tenant_id, cc.id AS cost_center_id, cc.name AS cost_center_name, cc.unit, count(*) AS total
FROM public.equipment e
JOIN public.cost_centers cc ON cc.id = e.cost_center_id
WHERE e.deleted_at IS NULL
GROUP BY e.tenant_id, cc.id, cc.name, cc.unit;

-- Inventário por contrato (Modo Prestador de Serviço: quantos equipamentos por contrato FP↔Cliente)
CREATE OR REPLACE VIEW public.v_equipment_by_contract AS
SELECT c.id AS contract_id, c.contract_number, c.fp_tenant_id, c.client_tenant_id, count(e.id) AS total_equipment
FROM public.contracts c
JOIN public.equipment e ON e.tenant_id = c.client_tenant_id AND e.deleted_at IS NULL
GROUP BY c.id, c.contract_number, c.fp_tenant_id, c.client_tenant_id;

-- Gestão de Riscos: detalhe que faltava em v_equipment_summary (reprovados = inspeção rejeitada mais recente)
CREATE OR REPLACE VIEW public.v_risk_summary AS
SELECT
  e.tenant_id,
  count(*) FILTER (WHERE e.status = 'blocked') AS total_blocked,
  count(*) FILTER (WHERE e.status = 'quarantine') AS total_quarantine,
  count(*) FILTER (WHERE e.expiration_date < CURRENT_DATE) AS total_expired,
  count(*) FILTER (WHERE e.expiration_date >= CURRENT_DATE AND e.expiration_date <= CURRENT_DATE + INTERVAL '30 days') AS total_expiring_soon,
  count(DISTINCT e.id) FILTER (WHERE i.result = 'rejected') AS total_rejected_last_inspection
FROM public.equipment e
LEFT JOIN LATERAL (
  SELECT result FROM public.inspections i2
  WHERE i2.equipment_id = e.id AND i2.deleted_at IS NULL
  ORDER BY i2.performed_at DESC LIMIT 1
) i ON true
WHERE e.deleted_at IS NULL
GROUP BY e.tenant_id;

-- Auditorias: não conformidades encontradas / resolvidas / pendentes + status geral
CREATE OR REPLACE VIEW public.v_nonconformity_summary AS
SELECT
  tenant_id,
  count(*) AS total_found,
  count(*) FILTER (WHERE status = 'resolved') AS total_resolved,
  count(*) FILTER (WHERE status IN ('open', 'in_progress')) AS total_pending,
  round((count(*) FILTER (WHERE status = 'resolved'))::numeric / NULLIF(count(*), 0) * 100, 2) AS resolution_rate_percent
FROM public.nonconformities
GROUP BY tenant_id;

-- Treinamentos: colaboradores aptos vs inaptos (por pessoa, não por certificação)
CREATE OR REPLACE VIEW public.v_workforce_certification_status AS
SELECT
  tenant_id,
  count(DISTINCT user_id) FILTER (
    WHERE user_id NOT IN (
      SELECT uc2.user_id FROM public.user_certifications uc2
      WHERE uc2.tenant_id = user_certifications.tenant_id AND uc2.status = 'expired'
    )
  ) AS users_fit,
  count(DISTINCT user_id) FILTER (WHERE status = 'expired') AS users_unfit
FROM public.user_certifications
GROUP BY tenant_id;

-- Indicadores financeiros
CREATE OR REPLACE VIEW public.v_financial_summary AS
SELECT
  e.tenant_id,
  coalesce(sum(e.acquisition_value), 0) AS total_asset_value,
  coalesce(sum(e.acquisition_value) FILTER (WHERE e.status = 'retired'), 0) AS replaced_asset_value,
  coalesce(sum(coalesce(e.replacement_value, e.acquisition_value)) FILTER (
    WHERE e.expiration_date IS NOT NULL AND e.expiration_date <= CURRENT_DATE + INTERVAL '90 days'
  ), 0) AS projected_replacement_cost_90d,
  coalesce(sum(coalesce(e.replacement_value, e.acquisition_value)) FILTER (
    WHERE e.status IN ('blocked', 'quarantine')
  ), 0) AS estimated_nonconformity_cost
FROM public.equipment e
WHERE e.deleted_at IS NULL
GROUP BY e.tenant_id;
;
