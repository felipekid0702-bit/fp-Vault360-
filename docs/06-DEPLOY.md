# FP Vault360° — Etapa 6: Deploy (Vercel + Supabase)

> Estes passos precisam ser executados por você (ou via Claude Code com acesso à sua rede) — este ambiente de chat não tem acesso à internet para provisionar serviços externos.

## 1. Criar o projeto Supabase
1. Criar novo projeto em supabase.com (região São Paulo/`sa-east-1` recomendada para latência).
2. Copiar `Project URL`, `anon key` e `service_role key`.
3. Rodar as migrations em ordem, via SQL Editor ou CLI:
   ```
   supabase link --project-ref <seu-project-ref>
   supabase db push
   ```
   Ordem obrigatória: `001_core.sql` → `002_inventory.sql` → `003_inspections.sql` → `004_ropes_kits.sql` → `005_training_audit.sql` → `006_import_contracts_bi.sql` → `007_rls_policies.sql` → `008_admin_functions.sql` → `009_permissions_seed.sql`.

## 2. Criar o usuário Super Master
1. No Supabase Auth, criar usuário com `MASTER_EMAIL` (ex.: felipekid07@gmail.com) — a senha deve ser definida apenas no ambiente seguro, nunca em código.
2. Rodar manualmente (uma única vez, via SQL Editor, autenticado como esse usuário ou via service role):
   ```sql
   insert into users (id, tenant_id, is_super_master, full_name, email, active)
   values ('<auth_user_id>', null, true, 'Luiz Felipe dos Santos Ferreira', '<MASTER_EMAIL>', true);

   insert into user_roles (user_id, role_id, assigned_by)
   select '<auth_user_id>', id, '<auth_user_id>' from roles where code = 'super_master';
   ```

## 3. Configurar Storage
Criar buckets:
- `equipment-photos` (privado, políticas espelhando RLS por tenant via path `{tenant_id}/...`)
- `documents` (privado)
- `signatures` (privado)

## 4. Variáveis de ambiente (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # nunca NEXT_PUBLIC_
MASTER_EMAIL=
MASTER_PASSWORD=                 # apenas usado no script de setup, não em runtime
OPENAI_API_KEY=
WHATSAPP_API_TOKEN=
RESEND_API_KEY=
```

## 5. Deploy do frontend
```
vercel link
vercel env pull
vercel --prod
```

## 6. Pós-deploy
- Configurar domínio customizado.
- Habilitar backups automáticos diários no Supabase (Point-in-Time Recovery).
- Configurar monitoramento (Vercel Analytics + Supabase Logs + alerta de erro via Sentry, opcional).
- Rodar `bump_version()` a cada release para manter `platform_settings.version` sincronizado (1.0 → 1.2 → 1.3 → 2.2 → 2.3...).
