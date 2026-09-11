# Modelo de dados operacional FP

## Entidades centrais

```text
tenant/cliente
  ├─ unidade/local
  ├─ usuário/responsável
  ├─ equipamento
  │   ├─ identificação/códigos
  │   ├─ documentos/fotos
  │   ├─ kit
  │   ├─ inspeções
  │   │   ├─ itens e classificações C/B/AV/AR/R
  │   │   ├─ evidências
  │   │   └─ assinaturas/laudo
  │   ├─ manutenção/quarentena
  │   └─ movimentações
  ├─ treinamentos/certificações
  └─ contratos/escopos
```

## Estado e transições

`recebido -> cadastrado -> disponível -> em inspeção -> apto` ou
`em inspeção -> quarentena -> manutenção -> reinspeção -> apto`; alternativamente
`quarentena -> inapto -> descartado`. Um item perdido/extraviado é um estado de
controle diferente de reprovado.

## Dados derivados e dados de fonte

- Derivados: status de inspeção por trigger/regra, desgaste de corda, indicadores.
- Fonte: classificação de cada item, observação, foto, assinatura, histórico e motivo.

Nenhum indicador deve substituir o registro fonte. Relatórios precisam apontar para
os eventos e documentos que os originaram.

## Requisitos de integridade

- identificador único por tenant;
- referência e número individual não devem ser confundidos;
- inspeção sempre vinculada a equipamento/template/inspetor/data;
- evidência ligada à inspeção e, quando possível, ao item;
- AR/R exige ação/quarentena;
- retorno exige reinspeção e responsável;
- exclusão deve ser lógica para preservar histórico;
- mudanças críticas devem entrar em trilha de auditoria.

## Campos adicionais necessários para aderência futura

O schema atual precisa ser avaliado para suportar: classificação FP por item, motivo de
quarentena, eventos de manutenção/descarte, ações de AV/AR, origem de periodicidade,
metadados fotográficos, documento de decisão e estado anterior/novo de movimentação.
Este documento não autoriza alteração de banco; é uma lista de requisitos para fase
de projeto.
