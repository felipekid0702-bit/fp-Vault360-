# FP Vault360°

Aplicação Next.js do FP Vault360°, com Supabase Auth, PostgreSQL, Storage e RLS multiempresa.

## Execução local

1. Copie `.env.example` para `.env.local`.
2. Preencha as variáveis do Supabase. `SUPABASE_SERVICE_ROLE_KEY` e `MASTER_PASSWORD` são somente servidor.
3. Instale as dependências com `npm install` fora de pastas sincronizadas, se o Google Drive bloquear `node_modules`.
4. Execute `npm run dev`.

## Banco

Na raiz `fpvault360/`, execute `supabase start` e depois `supabase db reset` para aplicar as migrations em `supabase/migrations`.

Em um projeto remoto, use `supabase link --project-ref <ref>` e `supabase db push`.

## Super Master

Configure `MASTER_EMAIL`, `MASTER_PASSWORD` e `BOOTSTRAP_SECRET` no ambiente do servidor. Após o primeiro deploy, faça uma requisição `POST /api/admin/bootstrap` com o header `x-bootstrap-secret`. A rota é idempotente e cria apenas um Super Master.

Nunca registre a senha ou a service role key em código, logs ou documentação.

## Validações

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Estado atual da construção

- Kits, Treinamentos, Auditorias e Contratos possuem telas de consulta e formulários de criação conectados às APIs.
- O formulário de Contratos usa `/api/tenants` para selecionar clientes respeitando o isolamento RLS.
- Inspeções, Equipamentos e Importação já possuem fluxos próprios implementados.
- Ainda falta transformar a tela de Relatórios/BI em dashboard detalhado e criar o fluxo de lançamento de certificações para usuários.

Neste ambiente, a instalação local das dependências está incompleta: `npm install` fica preso durante a resolução do lockfile e `tsc` não está disponível em `node_modules/.bin`. Os diagnósticos do editor foram usados para validar os arquivos alterados.
