# Relatório objetivo de aderência ao processo FP

**Data da avaliação:** 11/09/2026  
**Base considerada:** fichas FP01–FP12, apostilas técnicas, planilhas operacionais
e documentação de auditoria do FP Vault360°.

## Resumo executivo

O FP Vault360° já possui uma base tecnológica consistente e cobre boa parte da
estrutura necessária para inventário, inspeções, documentos, treinamentos,
certificações, contratos, importação e indicadores. Entretanto, a aderência ao
processo FP ainda não é completa porque o processo oficial depende de uma cadeia
operacional integrada: identificação, inspeção por ficha, decisão técnica,
quarentena, reparo, reinspeção, liberação ou descarte, sempre com evidência e
rastreabilidade.

**Aderência funcional estimada: 55%.**

O percentual é uma estimativa de cobertura operacional, não uma medição de código.
Considera que possuir tabelas, telas ou APIs genéricas não equivale a atender uma
regra FP validada. A estimativa deve ser revisada após testes com equipamentos reais,
aplicação das migrations pendentes e validação do responsável técnico.

## 1. Funcionalidades que já atendem ao processo FP

### Estrutura de plataforma

- autenticação e controle de acesso;
- isolamento por tenant/cliente;
- papéis e permissões;
- trilha de auditoria de operações;
- arquitetura modular em Next.js, Supabase e PostgreSQL;
- validação de entradas nas principais APIs.

### Inventário e identificação básica

- cadastro de equipamentos;
- fabricante, categoria, modelo e número de série;
- código interno e códigos de identificação;
- localização;
- datas de aquisição e primeira utilização;
- nota fiscal;
- status operacional;
- fotos e documentos como estrutura de suporte;
- kits e componentes;
- controle específico de cordas, cortes, comprimento e desgaste.

### Inspeções como infraestrutura

- templates e itens configuráveis;
- tipos de inspeção de aquisição, pré-uso, periódica, extraordinária e pós-queda;
- vínculo entre equipamento, template, inspetor, data e resultado;
- itens críticos;
- evidências e assinaturas como entidades relacionadas;
- classificação FP C/B/AV/AR/R prevista no modelo evoluído;
- veredito APTO/INAPTO previsto no fluxo evoluído;
- histórico e local da inspeção;
- objetivos e documentos de origem dos templates FP01–FP12.

### Gestão administrativa

- treinamentos;
- catálogo e emissão de certificações;
- validade de certificações;
- auditorias e planos de ação;
- contratos e escopos;
- importação de dados;
- notificações como infraestrutura;
- BI e relatórios básicos.

Essas funcionalidades atendem principalmente à **base estrutural** do processo FP.
Elas permitem organizar os dados necessários, mas algumas ainda dependem de regras
operacionais específicas para serem consideradas plenamente aderentes.

## 2. Funcionalidades que ainda são genéricas

### Motor de checklist

O motor foi projetado como checklist configurável. Isso é reutilizável, mas não
garante, por si só, que cada ficha FP esteja sendo executada na ordem, com os
campos e evidências corretos.

### Resultado e decisão

O modelo genérico de `approved`, `approved_with_restriction` e `rejected` não
substitui integralmente a decisão FP por item:

- C — comentário;
- B — bom;
- AV — a vigiar;
- AR — a reparar;
- R — rejeitar.

O resultado geral também não pode ser calculado apenas pela soma de respostas. Deve
considerar histórico, criticidade, evidência, documentação e competência do
responsável.

### Cadastro de equipamento

O cadastro atende ao inventário geral, mas ainda é genérico em relação a:

- referência do modelo versus número individual;
- identificação obrigatória da ficha FP aplicável;
- estado operacional derivado do ciclo de inspeção;
- origem da periodicidade;
- vínculo entre equipamento, unidade, usuário, kit e contrato;
- documentos obrigatórios por família de equipamento.

### Documentos, fotos e assinaturas

O sistema possui estrutura para documentos, evidências e assinaturas, mas a
infraestrutura genérica não garante:

- foto obrigatória por tipo de achado;
- foto vinculada ao item exato do checklist;
- documento de fabricante relacionado ao equipamento;
- assinatura efetivamente capturada e validada;
- retenção e versionamento conforme política FP.

### Certificações e treinamentos

O módulo distingue parcialmente treinamento e certificação, mas ainda é genérico em
relação à autorização operacional do inspetor. Uma certificação registrada não deve
ser automaticamente tratada como competência para executar ou aprovar qualquer ficha.

### BI e notificações

Existem cards, views e infraestrutura de notificações, mas ainda não há cobertura
completa dos indicadores e eventos específicos do processo FP.

## 3. Funcionalidades que precisam ser adaptadas

### 3.1 Templates FP01–FP12

Cada família deve possuir um template oficial, versionado e associado à categoria
correta:

| Família | Ficha |
|---|---|
| Ascensor | FP01 |
| Descensor | FP02 |
| Trava-quedas | FP03 |
| Talabarte | FP04 |
| Elemento metálico | FP05 |
| Elemento têxtil | FP06 |
| Corda | FP07 |
| Capacete | FP08 |
| Cinto de segurança | FP09 |
| Assento conforto | FP10 |
| Conector | FP11 |
| Polia | FP12 |

Os itens devem preservar as seções visual, funcional, conforto e identificação
quando aplicáveis, além de marcar criticidade e evidência exigida.

### 3.2 Classificação técnica

O formulário e as APIs devem eliminar a dependência operacional de OK/NOK/NA como
linguagem principal. O status legado pode ser mantido para compatibilidade, mas a
decisão oficial deve ser C/B/AV/AR/R, com:

- observação obrigatória para AV, AR e R;
- ação obrigatória para AV, AR e R;
- NOK técnico obrigatório para AR e R;
- evidência obrigatória para dano e rejeição;
- regra explícita para uso restrito em AV;
- bloqueio de uso para AR até reparo e reinspeção;
- rejeição e quarentena para R.

### 3.3 APTO e INAPTO

O resultado final precisa incorporar:

- classificação dos itens;
- itens críticos;
- queda de fator 1 ou maior;
- contato químico ou abrasivo;
- temperatura fora de -40 °C a 80 °C;
- modificação não autorizada;
- identificação insuficiente;
- histórico ausente ou inconsistente;
- evidência e documentação exigidas.

O resultado deve ser assinado e preservar a justificativa da decisão.

### 3.4 Quarentena, manutenção e retorno

Os status existentes de equipamento precisam ser convertidos em uma máquina de
estados auditável:

```text
Recebido
→ Cadastrado
→ Disponível
→ Em inspeção
→ APTO
```

ou:

```text
Não conforme
→ Quarentena
→ Análise
→ Reparo autorizado
→ Reinspeção
→ Liberação
```

ou:

```text
Quarentena
→ Descarte/descaracterização
→ Equipamento aposentado
```

O retorno ao uso nunca deve ocorrer diretamente após o reparo, sem reinspeção e
responsável competente.

### 3.5 Rastreabilidade da planilha operacional

O importador genérico precisa ser adaptado para preservar os campos da planilha,
incluindo:

- usuário;
- unidade/local;
- referência;
- número individual;
- fabricante e modelo;
- NF;
- aquisição e primeira utilização;
- data da inspeção;
- próxima inspeção;
- kit;
- movimentações;
- manutenção;
- descarte;
- histórico de uso.

Também é necessário impedir duplicidade por combinação de identificadores e manter o
histórico quando o item mudar de usuário, kit, cliente ou localização.

### 3.6 Laudos

O relatório FP deve reconstruir o estado do equipamento em uma data específica,
incluindo:

- identificação completa;
- ficha e versão do template;
- respostas C/B/AV/AR/R;
- observações e ações;
- histórico;
- fotos;
- assinatura;
- resultado APTO/INAPTO;
- próximo controle;
- responsável e local.

### 3.7 Competências

Certificações precisam ser ligadas a competências operacionais:

- Inspetor Nível 1;
- Inspetor Competente;
- Supervisor;
- Administrador.

O sistema deve verificar se o usuário possui competência válida para executar,
revisar ou liberar cada tipo de inspeção.

## 4. Funcionalidades que precisam ser criadas

1. Máquina de estados completa do equipamento, com transições autorizadas.
2. Registro de recebimento e conferência inicial.
3. Quarentena com motivo, responsável, local, análise e decisão.
4. Ordem de manutenção/reparo com autorização, serviço, peça, responsável e
   documento comprobatório.
5. Reinspeção obrigatória após manutenção.
6. Descarte/descaracterização com evidência fotográfica e registro imutável.
7. Histórico de movimentação com origem, destino, usuário, data, motivo e estado
   anterior/novo.
8. Upload de fotos e documentos diretamente no fluxo da inspeção.
9. Evidência vinculada ao item específico do checklist.
10. Captura e validação de assinatura digital.
11. Gerador de laudo PDF oficial armazenado e versionado.
12. Matriz de periodicidade por fabricante, norma, risco e contrato.
13. Verificação de competência do inspetor no momento da inspeção.
14. Portal visual do cliente com permissões por contrato e unidade.
15. BI executivo com APTO/INAPTO, AV/AR/R, quarentena, descarte, manutenção,
    vencimentos e produtividade.
16. Alertas agendados para inspeções, certificados, contratos e manutenções.
17. Sincronização mobile para inspeções em campo, fotos, assinatura e operação
    offline.
18. Camada de IA governada para sugestão e consulta, sem decisão autônoma de
    segurança.

## 5. Próximo módulo de maior impacto operacional

O próximo módulo de maior impacto é o **Ciclo de Não Conformidade e Liberação do
Equipamento**, composto por:

1. quarentena;
2. análise técnica;
3. manutenção/reparo autorizado;
4. reinspeção;
5. liberação ou descarte;
6. evidências e assinatura;
7. histórico de movimentação e decisão.

Esse módulo deve ser priorizado antes de portal, BI avançado, IA ou mobile porque
fecha o principal risco operacional: um equipamento reprovado voltar ao uso sem
tratamento, documentação ou aprovação competente.

## 6. Estimativa percentual de aderência

### Estimativa geral: **55%**

| Área | Estimativa | Justificativa |
|---|---:|---|
| Plataforma, autenticação e isolamento | 80% | Base técnica e RBAC estruturados. |
| Cadastro e inventário | 65% | Cadastro amplo, mas faltam regras FP e ciclo de recebimento. |
| Templates FP01–FP12 | 60% | Estrutura e catálogo preparados; falta validação operacional completa e versionamento controlado. |
| Classificação e decisão FP | 65% | C/B/AV/AR/R e APTO/INAPTO previstos, mas dependem de validação das regras e banco aplicado. |
| Quarentena, manutenção e descarte | 30% | Status e base de dados existem, mas o processo completo ainda precisa de telas, autorizações e reinspeção. |
| Rastreabilidade | 45% | Audit log, cordas, kits e importação existem; falta o histórico operacional integrado. |
| Evidências e laudos | 35% | Estrutura de evidências/assinaturas existe; PDF oficial, captura e vínculo por item ainda faltam. |
| Certificações e competências | 45% | Catálogo, emissão e validade existem; competência operacional e documentação precisam ser fechadas. |
| Portal do cliente | 25% | Há base de contratos e consultas, mas falta portal completo e controle visual de escopo. |
| BI executivo | 40% | Há views e cards, mas faltam indicadores FP completos e rastreabilidade da origem. |
| Automações | 30% | Notificações existem como infraestrutura; faltam jobs, escalonamento e canais reais. |
| Mobile | 10% | APIs podem ser reutilizadas, mas não há aplicativo nem sincronização offline. |

### Interpretação

- **0–30%:** estrutura inicial ou genérica.
- **31–50%:** parcialmente operacional.
- **51–70%:** MVP avançado com aderência relevante, mas ainda não completo.
- **71–90%:** operação FP controlada, dependente de validação e treinamento.
- **91–100%:** aderência validada em operação real, com evidência, auditoria e
  aprovação formal.

O FP Vault360° está na faixa de **MVP avançado com aderência relevante**, ainda não
na condição de produto plenamente validado para todo o ciclo operacional FP.

## Conclusão

O maior valor já entregue está na base de inventário, arquitetura multiempresa,
checklists, inspeções, documentos, treinamentos e integrações administrativas. A
principal lacuna não é a ausência de telas isoladas, mas a falta de fechamento do
ciclo de decisão e controle do equipamento após uma não conformidade.

A sequência de maior retorno é:

```text
Quarentena
→ Manutenção autorizada
→ Reinspeção
→ Laudo assinado
→ Liberação ou descarte
→ Histórico completo
```

Somente depois desse ciclo estar validado com equipamentos reais deve-se priorizar
portal do cliente, BI avançado, automações, IA e aplicativo mobile.
