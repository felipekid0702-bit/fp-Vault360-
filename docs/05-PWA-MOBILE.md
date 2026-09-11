# FP Vault360° — Etapa 5: PWA Mobile

## Manifest e ícones
- `public/manifest.json` já criado (nome, cores da marca, ícones 192/512).
- Adicionar `apple-touch-icon` e splash screens iOS via `next-pwa` ou configuração manual em `<head>`.

## Service Worker — estratégia de cache
Recomenda-se `next-pwa` (wrapper sobre Workbox) com estratégias diferenciadas:

| Recurso | Estratégia | Motivo |
|---|---|---|
| App shell (JS/CSS) | `StaleWhileRevalidate` | carregamento instantâneo, atualização em background |
| Assets de marca/imagens | `CacheFirst` (30 dias) | raramente mudam |
| `/api/equipment`, `/api/inspections` (GET) | `NetworkFirst` com fallback em cache | prioriza dado fresco, funciona offline com último snapshot |
| Uploads de evidência/foto | Fila de sincronização (Background Sync API) | inspeção pré-uso em campo sem sinal |

## Operação offline (módulo de Inspeção Pré-Uso)
1. Checklist e dados do equipamento são pré-carregados em IndexedDB ao abrir o app com conexão.
2. Inspeção realizada offline grava localmente (IndexedDB) com status `pending_sync`.
3. Ao restabelecer conexão, um worker de sincronização envia os registros pendentes para `/api/inspections`, respeitando ordem cronológica.
4. Conflitos (ex.: equipamento bloqueado por outro usuário nesse meio-tempo) são resolvidos com aviso explícito ao inspetor — nunca sobrescrita silenciosa.
5. Fotos capturadas offline ficam em blob local até o upload ser confirmado; só então a referência é gravada em `equipment_photos`/`inspection_evidences`.

## Instalação
- Prompt de instalação customizado (`beforeinstallprompt`) disparado após o primeiro login bem-sucedido, não na primeira visita.
- Mobile-first: todos os componentes de formulário (checklist, cadastro rápido) otimizados para toque, com campos grandes e QR scanner nativo via `getUserMedia`.
