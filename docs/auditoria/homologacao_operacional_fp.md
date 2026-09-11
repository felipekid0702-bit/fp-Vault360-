# Homologação operacional FP Vault360°

## Data e escopo

Homologação executada em 11/09/2026, após autorização explícita para aplicar as migrations 014 e 015 no Supabase remoto vinculado ao projeto.

Não foram executados deploy, push de código ou alterações de autenticação de usuários. As migrations foram aplicadas pelo Supabase CLI.

## Migrations aplicadas

As migrations locais 010 a 015 foram aplicadas com sucesso:

- 010 — modelo de inspeções FP;
- 011 — templates FP01–FP12;
- 012 — ciclo operacional, quarentena, manutenção, descarte e laudos;
- 013 — evidências;
- 014 — clientes, proprietários, fabricantes e kits;
- 015 — serviços, `service_id`, troca obrigatória de senha e permissões adicionais.

Durante a aplicação, a Migration 012 encontrou uma incompatibilidade de resolução da função UUID no schema remoto. A migration foi ajustada de forma equivalente para usar `extensions.uuid_generate_v4()`. Depois disso, as migrations 012, 013, 014 e 015 foram aplicadas com sucesso.

O histórico remoto agora contém todas as migrations locais 001–015 e as 13 migrations timestamped já existentes.

## Schema remoto confirmado

Consultas de verificação confirmaram a existência de:

- tabela `clients`;
- tabela `services`;
- `users.must_change_password`;
- `equipment.owner_type`;
- `equipment.client_id`;
- `equipment.service_id`;
- `manufacturers.status`;
- `manufacturers.notes`;
- `kits.client_id`;
- `kits.description`.

Também foram confirmados os triggers:

- `trg_clients_updated_at`;
- `trg_manufacturers_updated_at`;
- `trg_services_updated_at`;
- `trg_equipment_client_tenant`;
- `trg_equipment_service_tenant`.

## Validação técnica

- `supabase db push --linked --include-all --yes`: aprovado após correção UUID.
- `supabase migration list --linked`: migrations 001–015 sincronizadas.
- Consulta de schema remoto: aprovada.
- Consulta de triggers: aprovada.
- `npm run build`: aprovado.
- `npm run typecheck`: aprovado durante a validação anterior e o build também concluiu a verificação de tipos.

## Fluxos liberados para homologação autenticada

Com o schema aplicado, os seguintes fluxos deixaram de estar bloqueados pela ausência de tabelas/colunas:

- cadastro de fabricantes;
- cadastro de clientes;
- equipamentos FP;
- equipamentos de cliente;
- vínculo cliente → serviço → equipamento;
- kits com cliente;
- templates e inspeções FP01–FP12;
- evidências;
- quarentena;
- manutenção;
- descarte;
- laudos;
- troca obrigatória de senha;
- permissões e serviços.

## O que foi comprovado nesta execução

- O gargalo de schema foi removido.
- As migrations foram aplicadas sem necessidade de `migration repair`.
- O banco remoto contém as estruturas que antes estavam ausentes.
- A aplicação continua compilando contra o schema atualizado.
- O histórico local e remoto de migrations está alinhado.

## O que ainda exige cenário com sessão autenticada

Não foi possível declarar como executados neste ambiente, sem uma sessão de usuário e dados de teste controlados:

- criar, editar e pesquisar fabricante;
- criar, editar e pesquisar cliente;
- criar e editar equipamento FP;
- criar e editar equipamento de cliente;
- criar serviço e vinculá-lo a equipamento;
- criar e editar kit;
- concluir inspeções APTO, AV, AR e R;
- abrir e liberar quarentena;
- registrar manutenção e descarte;
- gerar e baixar laudo;
- validar permissões por cada perfil;
- executar troca obrigatória de senha em uma conta real.

Esses fluxos agora estão tecnicamente desbloqueados, mas ainda precisam ser exercitados pela interface com credenciais válidas.

## Pendências funcionais identificadas

- Exportações PDF/XLSX/CSV ainda não foram homologadas como geração real.
- Área do cliente ainda não possui superfície completa de portal.
- GET de laudo ainda gera/sobrescreve o artefato para preservar compatibilidade.
- Assinatura gráfica em canvas ainda não foi homologada.
- Alguns endpoints dependem de RLS e do helper de autorização, que devem ser validados com perfis reais.

## Aderência após aplicação do banco

Estimativa atual:

- aderência do código: aproximadamente 72%;
- aderência operacional estrutural: aproximadamente 75%;
- aderência operacional comprovada por cenários reais: ainda não recalculada, pois os testes autenticados não foram executados nesta sessão.

O principal bloqueio estrutural — migrations 014 e 015 ausentes — foi resolvido.
