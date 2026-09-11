# Estado atual da aplicação — FP Vault360°

**Data da avaliação:** 11/09/2026  
**Aplicação:** FP Vault360°  
**Stack:** Next.js 14, React 18, TypeScript, Supabase, PostgreSQL e Tailwind CSS

## 1. Resumo executivo

O FP Vault360° encontra-se em estágio de MVP operacional avançado. A aplicação possui
autenticação Supabase, estrutura multiempresa, módulos de inventário, inspeções,
cordas, kits, auditorias, contratos, treinamentos, certificações, importação e BI
inicial.

O motor de inspeções foi ampliado para suportar a operação FP, incluindo:

- classificação por item `C`, `B`, `AV`, `AR` e `R`;
- observação para achados de atenção, reparo ou rejeição;
- ação/decisão associada ao achado;
- histórico informado pelo usuário;
- local da inspeção;
- veredito `APTO` ou `INAPTO`;
- templates oficiais FP01–FP12 preparados em migration incremental;
- regra de reprovação para itens AR/R e restrição para itens AV.

A migration incremental foi criada, mas ainda depende de aplicação controlada no
Supabase remoto.

## 2. Estado técnico

### Frontend

Implementado em Next.js App Router, com páginas para:

- Dashboard;
- Equipamentos;
- Fabricantes;
- Categorias;
- Inspeções;
- Nova inspeção;
- Cordas;
- Kits;
- Treinamentos e certificações;
- Auditorias;
- Contratos;
- Importação;
- Relatórios e BI;
- Sobre.

O layout utiliza a identidade visual FP Vault360° e navegação centralizada no layout
do dashboard.

### Backend e APIs

As APIs seguem o padrão de rotas do Next.js e respostas `{ data }` ou `{ error }`.
As entradas são validadas com Zod nas principais rotas.

Rotas disponíveis incluem:

- `/api/equipment`;
- `/api/inspections`;
- `/api/inspections/templates/[id]`;
- `/api/ropes/[equipmentId]`;
- `/api/ropes/cuts`;
- `/api/kits`;
- `/api/treinamentos`;
- `/api/certificacoes`;
- `/api/certificacoes/emitir`;
- `/api/auditorias`;
- `/api/contratos`;
- `/api/importacao`;
- `/api/bi/summary`;
- `/api/tenants`;
- rotas administrativas de bootstrap e tenants.

### Banco e Supabase

O projeto possui migrations organizadas para:

1. núcleo, tenants, usuários e RBAC;
2. inventário e documentos;
3. templates e inspeções;
4. cordas e kits;
5. treinamentos e auditorias;
6. importação, contratos e BI;
7. RLS;
8. funções administrativas;
9. permissões;
10. modelo FP de inspeção.

A migration `010_fp_inspection_model.sql` não altera as migrations anteriores. Ela
adiciona campos e regras para adequação às fichas FP e prepara o catálogo FP01–FP12.

## 3. Módulos funcionais

### Equipamentos

Possui cadastro, categoria, fabricante, localização, serial/número interno, datas,
vida útil, status, códigos e associação com inspeções.

Status existentes:

- ativo;
- quarentena;
- bloqueado;
- aposentado;
- extraviado.

O fluxo completo de recebimento, manutenção autorizada, reinspeção e descarte ainda
precisa ser aprofundado para refletir integralmente o processo FP.

### Inspeções

O fluxo atual permite:

1. selecionar equipamento;
2. selecionar template;
3. carregar checklist;
4. responder os itens;
5. registrar histórico;
6. informar local;
7. classificar cada item;
8. registrar observação e ação;
9. informar veredito;
10. gravar a inspeção.

Classificações suportadas:

- `C` — comentário;
- `B` — bom;
- `AV` — a vigiar;
- `AR` — a reparar;
- `R` — rejeitar.

Validações atuais:

- AV, AR e R exigem observação;
- AR e R devem ser enviados como NOK;
- AR e R exigem veredito INAPTO;
- itens AV geram aprovação com restrição;
- itens AR/R geram reprovação.

### Templates FP01–FP12

A migration incremental prepara templates para:

- FP01 — Ascensor;
- FP02 — Descensor;
- FP03 — Trava-quedas;
- FP04 — Talabarte;
- FP05 — Elemento metálico;
- FP06 — Elemento têxtil;
- FP07 — Corda;
- FP08 — Capacete;
- FP09 — Cinto de segurança;
- FP10 — Assento conforto;
- FP11 — Conector;
- FP12 — Polia.

Os templates possuem objetivo, documento de origem, seções, itens críticos e exigência
de evidência. Eles só estarão disponíveis no ambiente Supabase depois da aplicação da
migration 010.

### Cordas

Possui:

- detalhes da corda;
- comprimento atual;
- cortes;
- histórico de utilização;
- cálculo de desgaste;
- aposentadoria.

### Kits

Possui cadastro e controle básico dos componentes. O banco prevê cálculo de status
pelo pior componente do kit.

### Treinamentos e certificações

Possui:

- catálogo de treinamentos;
- catálogo de certificações;
- associação entre treinamento e certificação;
- emissão de certificação para usuário;
- cálculo de validade;
- status válido, vencendo e vencido.

Ainda faltam documentos comprobatórios, emissor, renovação, competências formais e
vínculo explícito com a autorização de inspetor competente.

### Auditorias

Possui cadastro e estrutura inicial para auditorias, não conformidades e planos de
ação.

### Contratos

Possui cadastro de contratos, clientes, escopos, vigência e status.

### Importação

Possui fluxo de upload, pré-visualização, criação de job e processamento.

### BI e relatórios

Possui cards e resumo operacional com dados de equipamentos, inspeções, treinamentos
e contratos. Ainda não é um dashboard executivo completo com filtros, gráficos,
exportação e rastreabilidade de cada indicador.

## 4. Fontes oficiais FP incorporadas à análise

As fontes oficiais estão em:

```text
app/public/docs/training_reference
app/public/docs/inspection_templates
app/public/docs/business_rules
```

Foram considerados:

- apostilas e normas técnicas;
- fichas FP01–FP12;
- planilha de controle de inspeção.

Documentos analíticos gerados:

- `docs/knowledge_base/base_conhecimento_fp.md`;
- `docs/business_rules/modelo_operacional_fp.md`;
- `docs/business_rules/rastreabilidade.md`;
- `docs/business_rules/modelo_dados_operacional.md`;
- `docs/inspection_templates/catalogo_inspecoes.md`;
- `docs/inspection_templates/templates_digitais.md`;
- `docs/auditoria/gap_analysis.md`;
- `docs/planning/plano_implementacao_fpvault360.md`.

## 5. Segurança e controle de acesso

Mantidos:

- Supabase Auth;
- middleware de sessão;
- clientes Supabase server/browser;
- isolamento por tenant;
- RLS;
- RBAC;
- proteção especial do Super Master;
- trilha de auditoria existente.

Nenhuma alteração foi feita na autenticação, RLS ou políticas de acesso durante a
implementação do motor FP.

## 6. Dependências e execução

Scripts disponíveis no aplicativo:

```text
npm run dev
npm run build
npm run lint
npm run typecheck
```

A CLI Supabase está disponível pelo pacote instalado no aplicativo:

```powershell
npx supabase --version
```

Versão validada no ambiente:

```text
2.117.0
```

## 7. Validação realizada

O build de produção foi executado com sucesso após as alterações:

```text
Compiled successfully
Linting and checking validity of types
Generating static pages (37/37)
```

As novas rotas de certificações e o fluxo atualizado de inspeções foram reconhecidos
pelo Next.js.

## 8. Pendências prioritárias

### Prioridade P0

- aplicar e validar a migration 010 em ambiente controlado;
- validar os templates FP01–FP12 com inspetor/gestor da FP;
- testar o fluxo com equipamentos reais;
- implementar quarentena, manutenção, reinspeção e descarte completos;
- completar evidências fotográficas e laudo assinado.

### Prioridade P1

- formalizar periodicidades por família;
- definir matriz de decisão para AV e AR;
- completar documentos e renovação de certificações;
- melhorar rastreabilidade de movimentações;
- ampliar BI e relatórios executivos;
- concluir portal do cliente.

### Prioridade P2

- automações de vencimento e notificações;
- operação mobile/offline;
- integrações externas;
- recursos assistidos por IA.

## 9. Riscos atuais

- A migration 010 ainda não foi aplicada ao banco remoto.
- Os templates dependem de categorias de equipamentos compatíveis para seleção
  automática.
- O banco atual ainda possui campos legados `ok/nok/na`; a classificação FP é
  adicionada incrementalmente.
- Evidências e assinaturas existem como base técnica, mas ainda não formam um laudo
  FP completo.
- Periodicidades exatas não foram fixadas pelas fontes e não devem ser inventadas.
- A aprovação final continua dependendo da validação do processo pela FP.

## 10. Próxima sequência recomendada

1. Fazer backup e aplicar a migration 010 em ambiente de teste.
2. Validar se os templates FP01–FP12 aparecem corretamente.
3. Executar inspeções-piloto nas doze famílias.
4. Ajustar itens, criticidade e evidências com o responsável técnico.
5. Implementar quarentena, manutenção, reinspeção e descarte.
6. Gerar laudo oficial com fotos e assinatura.
7. Repetir a validação com a planilha operacional.
8. Só então avançar para portal, BI avançado, automações e mobile.

## Conclusão

O FP Vault360° já possui a base estrutural de um produto operacional. A principal
mudança necessária para aderência real à FP está no fechamento do ciclo de inspeção:
template oficial, classificação técnica, evidência, decisão, quarentena, manutenção,
reinspeção, laudo e rastreabilidade.

O sistema está pronto para a etapa de validação controlada da migration 010 e para
testes-piloto com dados operacionais reais.
