# Changelog

## Entrega FP Completa — 11/09/2026

### Adicionado

- Templates oficiais de inspeção FP01–FP12.
- Classificação técnica C/B/AV/AR/R.
- Veredito APTO/INAPTO e regras de decisão FP.
- Fluxos de quarentena, manutenção, reinspeção e descarte.
- Histórico de movimentações e rastreabilidade operacional.
- Upload de evidências e assinaturas de inspeção.
- Geração de laudo oficial em PDF.
- Armazenamento de laudos no Supabase Storage.
- Hash SHA-256 para controle de integridade dos laudos.
- Competências operacionais e registros de competência.
- APIs de apoio ao ciclo FP.

### Alterado

- Motor de inspeções para suportar o modelo FP.
- Validações de inspeção, evidências, ações e vereditos.
- Serviço de inspeções para persistir histórico, evidências e assinatura.
- Serviço de certificações para registrar emissor e documento.
- Dependências do aplicativo para geração de PDF com `pdfkit`.

### Migrations

- `010_fp_inspection_model.sql`
- `011_fp_inspection_templates_complete.sql`
- `012_fp_operational_lifecycle.sql`
- `013_fp_evidence_linkage.sql`

### Validação

- `npm run build` aprovado.
- `npm run typecheck` aprovado.
- 46 páginas e rotas geradas.

### Pendências de publicação

- Aplicar as migrations no Supabase remoto em ambiente controlado.
- Validar as policies do Storage e o bucket `documents`.
- Executar testes operacionais com dados reais ou de homologação.
