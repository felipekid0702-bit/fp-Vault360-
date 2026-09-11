# Auditoria de aderência FP Vault360°

## Escopo

Auditoria estática do Next.js em `app/src`, serviços, APIs, componentes, migrations
existentes e fontes oficiais em `app/public/docs`. Não houve alteração de código,
Supabase, migrations, RLS ou autenticação.

## 1. Atende atualmente

- Autenticação/middleware e isolamento multiempresa.
- Cadastro de equipamento com fabricante, categoria, localização, datas, serial,
  códigos, fotos e status.
- Checklist dinâmico por template; itens não ficam hardcoded no componente.
- Tipos de inspeção incluindo aquisição, pré-uso, periódica, extraordinária e
  pós-queda.
- Resultado por item OK/NOK/NA e reprovação automática de item crítico no banco.
- Registro de evidências e assinaturas disponível no serviço/schema.
- Cordas com detalhes, cortes, histórico de uso e desgaste calculado.
- Kits, auditorias, contratos, importação e BI possuem base de módulos.
- Treinamento/certificação possui catálogo, emissão e validade básica na camada atual.

## 2. Atende parcialmente

### Inspeções

O checklist atual usa `ok/nok/na`, enquanto as fichas FP exigem C/B/AV/AR/R,
comentário e veredito APTO/INAPTO. A reprovação por item crítico existe, mas a
classificação AR/AV e os gatilhos históricos não estão modelados como decisões
obrigatórias. O formulário não exige observação para todo NOK no cliente; a fonte
exige comentário para decisão segura.

### Templates FP01–FP12

O sistema permite templates configuráveis, mas não foi identificado cadastro dos doze
templates oficiais nem a correspondência de categoria/item crítico com as fichas.
Sem essa carga, a funcionalidade é genérica e não representa o processo FP.

### Equipamentos

Há identificação e status, mas não há fluxo explícito de recebimento, quarentena,
manutenção autorizada, reinspeção e descarte com evidência completa. Alguns status
existem, porém não formam uma máquina operacional rastreável.

### Evidências e laudos

Serviços de upload/assinatura existem, mas não há confirmação de obrigatoriedade por
tipo de achado, geração de laudo oficial, checklist FP imprimível ou vínculo de foto a
item específico.

### Certificações e treinamentos

O fluxo recém-adicionado cobre cadastro/emissão e validade, mas ainda não comprova
documento, emissor, renovação, competências exigidas pelo treinamento FP ou vínculo
com autorização de inspetor competente.

### BI

Existem cards e views, mas não há dashboard executivo completo com filtros, origem do
indicador, vencimentos por fonte, quarentena, AR/R, manutenção e rastreabilidade.

## 3. Não atende ou está ausente

- Classificação C/B/AV/AR/R como dado persistente do item.
- Regra formal de gatilho: queda fator 1+, química/abrasivo, temperatura extrema e
  modificação externa.
- Fluxo de quarentena e descarte com evidência.
- Ordem de manutenção/reparo autorizado e reinspeção.
- Formulário completo de histórico da planilha operacional.
- Catálogo oficial FP01–FP12 carregado e versionado.
- Obrigatoriedade de fotos por tipo de defeito/evento.
- Laudo FP com assinatura, identificação, APTO/INAPTO e próximo controle.
- Rastreabilidade completa de movimentações e estado anterior/novo.
- Matriz de periodicidade com origem técnica/contratual.
- Portal de cliente aderente ao contrato e à evidência de inspeção.

## 4. Genérico ou desalinhado

- `ChecklistItemStatus` e UI OK/NOK/NA simplificam demais o formulário FP.
- `is_critical` isolado não representa AV, AR, R, ação e evidência.
- O resultado padrão `approved` na criação pode liberar logicamente antes da decisão
  detalhada, dependendo do trigger e da ordem de gravação.
- A nomenclatura “certificação” atual mistura catálogo e emissão.
- O modelo de equipamento possui `expiration_date`, mas fonte distingue validade,
  vida útil, inspeção e condição real.

## 5. Reaproveitável

- Arquitetura Next.js/Supabase e serviços por módulo.
- Templates e itens configuráveis existentes.
- Tabelas de inspeção, itens, evidências e assinaturas como base.
- Equipamentos, códigos, fotos, cordas, kits, contratos e audit log.
- Zod/API REST, RLS e middleware, que não devem ser reconstruídos sem necessidade.

## 6. Reconstruir/adaptar primeiro

1. Modelo de resultado por item e templates FP.
2. Fluxo de inspeção com histórico, evidência, APTO/INAPTO e quarentena.
3. Máquina de estados de manutenção, retorno e descarte.
4. Laudo e rastreabilidade de movimentações.
5. Certificação/treinamento documental e competências.

## 7. Riscos

- Automatizar aprovação com regra incompleta pode liberar EPI inseguro.
- Alterar migrations/RLS sem matriz de autoridade pode quebrar isolamento.
- Importar planilha sem normalização pode duplicar equipamentos.
- Tratar AV como aprovação ou AR como simples observação perde a decisão técnica.
- Usar periodicidade fixa sem fonte pode gerar vencimento falso.

## 8. Critério de aceite FP

Uma inspeção só estará aderente quando reproduzir uma ficha FP completa, conservar
histórico e evidências, impedir liberação em condição crítica, produzir APTO/INAPTO
assinado e permitir reconstrução da decisão por equipamento, cliente, unidade e data.
