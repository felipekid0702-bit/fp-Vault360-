# Sprint 04 — Validação operacional

## Escopo validado

Esta etapa foi concluída sem deploy, push, `supabase db push` ou alteração remota. A validação foi feita no código local e no build da aplicação.

## Funcionalidades implementadas nesta etapa

- Migration 015 preparada para `must_change_password`, serviços operacionais, vínculo serviço → equipamento e permissões de clientes/serviços/relatórios.
- Tela `/servicos` com listagem, criação e edição de serviços.
- API `/api/servicos` e `/api/servicos/[id]` com CRUD e exclusão lógica.
- Serviço de cliente disponível no formulário de equipamento e enviado como `service_id`.
- Validação de serviço obrigatório para equipamentos de cliente nas APIs.
- Trigger SQL para impedir vínculo entre tenants ou clientes diferentes.
- Rota `/trocar-senha`, API de atualização de senha e redirecionamento do middleware quando `must_change_password` estiver ativo.
- Link de navegação para Serviços, watermark atualizado e peso visual da sidebar.
- Fonte Ubuntu configurada como primeira opção global, com fallback local.
- Helper server-side de autorização aplicado a serviços, descarte, quarentena, manutenção e geração de laudos.
- Validação explícita de tenant adicionada às operações por ID nesses fluxos.

## Validação técnica

- `npm run typecheck`: aprovado.
- `npm run build`: aprovado; 53 páginas/rotas geradas.
- Rotas novas incluídas no build: `/servicos`, `/trocar-senha`, `/api/servicos`, `/api/servicos/[id]`, `/api/auth/profile` e `/api/auth/password`.

## O que funciona comprovadamente no código

- Compilação e verificação de tipos.
- Renderização da página de serviços.
- Formulário de serviço com cliente, OS, status e observações.
- APIs de serviço conectadas ao service layer existente.
- Bloqueio de equipamento de cliente sem serviço, quando a Migration 015 estiver aplicada.
- Bloqueio de serviço de outro tenant/cliente no banco, quando a Migration 015 estiver aplicada.
- Laudos exigem a permissão `inspections:approve` e a inspeção precisa pertencer ao tenant operacional.
- Fluxo de troca de senha com verificação da senha atual e confirmação.
- Redirecionamento de usuários marcados com `must_change_password`.

## O que ainda não foi homologado como operação real

- A Migration 015 não foi aplicada ao Supabase remoto; portanto, serviços, `must_change_password`, `service_id` e as novas políticas não podem ser declarados persistidos no ambiente conectado.
- Não foi possível comprovar criação/edição/exclusão real com usuário autenticado sem executar cenários no banco local/remoto.
- Os perfis Master01, Master02, Master03 e Sub Master foram preparados na migration, mas ainda não possuem usuários reais e matriz de permissões homologada.
- Exportações PDF/XLSX/CSV, área do cliente, assinatura gráfica e os fluxos completos de quarentena, manutenção, descarte, reinspeção e laudos permanecem pendentes de homologação ponta a ponta.
- A logo alternativa da FP Soluções continua dependente do SVG existente, que não possui conteúdo visual suficiente para ser considerado uma identidade final.
- O GET de laudos ainda gera e sobrescreve o artefato para preservar o consumo atual; a separação entre consulta e geração permanece pendente.

## Aderência estimada

A aderência do código local aumentou nos fluxos de serviços, vínculo cliente/equipamento e troca de senha, mas a aderência operacional real não deve ser elevada artificialmente enquanto as migrations 014/015 não estiverem aplicadas e os cenários autenticados não forem executados. Estimativa conservadora: **aproximadamente 72% no código preparado** e **aproximadamente 57% operacionalmente comprovado**.

## Próxima validação segura

Aplicar as migrations somente após revisão/autorização, iniciar o ambiente local com banco compatível e executar cenários autenticados de cliente, serviço, equipamento, permissões e troca de senha. Não há indicação de erro de compilação nesta etapa.
