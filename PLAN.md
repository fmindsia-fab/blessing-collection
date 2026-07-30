# PLAN.md — Blessing Collection (Catálogo Digital MVP)

## Contexto

A Blessing Collection vende bolsas e acessórios artesanais, hoje divulgados de forma dispersa (fotos soltas, redes sociais, WhatsApp), o que gera perguntas repetitivas, trabalho manual de atendimento e perda de vendas por falta de um catálogo centralizado. Este plano cobre o MVP de um catálogo digital responsivo com painel administrativo (sem código) e analytics simples de interesse por produto, construído para já nascer com arquitetura multiempresa (mesmo servindo só a Blessing Collection no MVP), permitindo atender outras artesãs/marcas no futuro sem retrabalho estrutural.

Escopo, regras e critérios de aceite completos estão no PRD já fornecido pelo usuário (mantido como fonte oficial dos requisitos). Este documento traduz o PRD em decisões técnicas concretas.

**Premissas confirmadas com o usuário:**
- Loja ativa resolvida via variável de ambiente (`STORE_SLUG`), sem lookup por domínio.
- Conta da proprietária criada manualmente no Supabase Studio — sem tela de cadastro público, sem script de seed.
- Projeto Supabase criado do zero no Milestone 3.
- Testes: 1-3 críticos por milestone (não suíte completa desde o início).
- Produtos **esgotados permanecem visíveis** no catálogo público (com identificação clara + botão "Consultar disponibilidade"); só `inactive`/arquivados ficam ocultos.
- Imagem de capa é um **campo explícito** (`is_cover`) que a proprietária pode marcar em qualquer imagem, não apenas a primeira por ordem.

**Regras inegociáveis do PRD:** sem Prisma/ORM (Supabase client + SQL puro), sem RBAC/múltiplos usuários por loja, sem exclusão definitiva (soft delete via `status`/`archived_at`), sem dados pessoais em `analytics_events` (sem IP, sem identificação de visitante), WhatsApp apenas via link `wa.me` com mensagem pré-formatada (sem API oficial), RLS nunca desativada, `service_role_key` nunca no frontend.

---

## 1. Arquitetura Geral

Next.js (App Router, TypeScript estrito) + Tailwind + shadcn/ui no frontend; Supabase (Postgres + Auth + Storage) no backend; deploy na Vercel.

**Resolução da loja ativa:** variável de ambiente `STORE_SLUG` (não pública), lida uma única vez por um helper centralizado — nunca espalhar `process.env.STORE_SLUG` pelo código:

```ts
// lib/store/get-active-store.ts
export const getActiveStore = cache(async () => {
  const slug = process.env.STORE_SLUG;
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from("stores").select("*")
    .eq("slug", slug).eq("status", "active").single();
  return data;
});
```

Todo Server Component/Server Action busca `activeStore.id` e filtra explicitamente por `store_id` — o schema é multi-tenant desde o início, então nenhuma query pode assumir "só existe uma loja" mesmo que isso seja verdade hoje. `store_id` chega aos Client Components via props do Server Component pai, nunca lido diretamente no client.

---

## 2. Modelo de Dados (Migration `0001_initial_schema.sql`)

Tabelas: `profiles`, `stores`, `categories`, `collections`, `products`, `product_images`, `product_variants`, `analytics_events` — seguindo a seção 11 do PRD.

Pontos de design que valem destaque:

- **Identidade visual em `stores`** (ajuste sobre a seção 11.2 do PRD, confirmado com o usuário): 3 campos de cor em vez de 2, mais fonte da marca escolhida de uma lista pré-definida:
  ```sql
  alter table stores add column color_primary text not null default '#000000';
  alter table stores add column color_secondary text not null default '#FFFFFF';
  alter table stores add column color_accent text not null default '#C9A227';
  alter table stores add column font_family text not null default 'playfair-display'
    check (font_family in ('playfair-display','cormorant-garamond','lora','montserrat','inter'));
  ```
  As 5 opções de fonte são carregadas via `next/font/google` no layout público (sem carregamento dinâmico de fontes arbitrárias — evita risco de fonte não licenciada/erro de digitação). Cores em hex, validadas no client (Zod) antes de salvar.
- `products.status`: `'available' | 'made_to_order' | 'sold_out' | 'inactive'` — os três primeiros são públicos, `inactive` é o único oculto (confirmado com o usuário).
- `product_images.is_cover boolean`, com **unique index parcial** `(product_id) where is_cover = true` — não apenas índice de performance, mas constraint real que impede duas capas para o mesmo produto:
  ```sql
  create unique index idx_product_images_one_cover
    on product_images(product_id) where is_cover = true;
  ```
- `product_variants`: variação por label (cor/tamanho) com preço específico opcional (seção 3.5) — sem variante o produto usa `price` base; com variante e preço próprio, o preço da variação substitui o base (sem cálculo de diferença).
- `analytics_events`: sem coluna de IP, user-agent ou identificador pessoal. Campo opcional `product_id`/`category_id`/`collection_id` conforme o tipo de evento.
- Índices dedicados a analytics: `(store_id, event_type, created_at desc)` e `(product_id, event_type)` — necessários para as queries agregadas de rankings sem scan completo.
- Todas as tabelas com `store_id` (exceto `profiles`) têm FK `on delete cascade` a partir de `stores`, reforçando isolamento por loja.
- Trigger genérica de `updated_at` reaproveitada em `stores`, `categories`, `collections`, `products`.

---

## 3. Row Level Security (Migration `0003_rls_policies.sql`)

RLS habilitada em todas as tabelas. Padrão: owner autenticada (`auth.uid() = owner_user_id` em `stores`, ou subquery via `store_id`/`product_id` nas tabelas filhas) tem acesso total à própria loja; visitante anônimo só lê registros com status público de uma loja ativa.

Pontos críticos:

- **Produtos:** política pública de SELECT inclui `status in ('available','made_to_order','sold_out')` — `inactive` nunca aparece para `anon`.
- **`analytics_events`:** `anon`/`authenticated` podem apenas **inserir** (`for insert`), com `with check` validando que `event_type` é um dos 4 válidos e que `product_id`/`category_id`/`collection_id`, se enviados, pertencem à mesma `store_id` do evento (evita poluir dados de outra loja). **Nenhuma política de SELECT existe para não-owner** — só a proprietária autenticada (`auth.uid() = owner_user_id` via `stores`) lê a tabela bruta. Sem política de UPDATE/DELETE — eventos são imutáveis.
- Esse é o mecanismo que garante: visitante grava evento com a `anon key`, mas jamais consegue consultar a tabela de eventos — a UI do dashboard exige sessão autenticada tanto pela RLS quanto pelo middleware.

---

## 4. Rotas (App Router) — mapeamento da seção 9 do PRD

```
app/
  (public)/
    page.tsx                          -- home: destaques, categorias, coleções, lançamentos
    produtos/page.tsx                 -- listagem paginada (12 iniciais + "carregar mais")
    produtos/[slug]/page.tsx          -- detalhe: galeria, variações, status, WhatsApp CTA
    categorias/[slug]/page.tsx
    colecoes/[slug]/page.tsx
  (admin)/
    login/page.tsx
    admin/page.tsx                    -- dashboard/analytics resumido
    admin/produtos/page.tsx
    admin/produtos/novo/page.tsx
    admin/produtos/[id]/editar/page.tsx
    admin/categorias/page.tsx
    admin/colecoes/page.tsx
    admin/analytics/page.tsx
    admin/configuracoes/page.tsx
proxy.ts
```

`proxy.ts` (renomeado de `middleware.ts` a partir do Next.js 16) redireciona `/admin/*` sem sessão para `/login`, e `/login` com sessão para `/admin` — é só UX; a segurança real é a RLS aplicada em toda query de Server Component/Server Action.

---

## 5. Estratégia de Analytics

**Registro não-bloqueante:** `lib/analytics/track.ts` dispara o insert no Supabase (client anon) em fire-and-forget — nunca `await` no call-site. No clique do WhatsApp, `track()` é chamado e o `window.open(waLink)` roda imediatamente, independente do resultado do insert; falha no insert só gera `console.warn`, nunca interrompe a navegação (requisito da seção 6.7/15 do PRD).

**Rankings e taxa de interesse sem N+1:** função RPC parametrizada por `store_id` e `p_days` (7/30/90/null=total), agregando `count(*) filter (where event_type = ...)` em uma única query:

```sql
create or replace function get_product_rankings(p_store_id uuid, p_days int default null)
returns table (product_id uuid, product_name text, views bigint, clicks bigint, interest_rate numeric)
language sql stable as $$
  select p.id, p.name,
    count(*) filter (where e.event_type = 'product_view') as views,
    count(*) filter (where e.event_type = 'whatsapp_click') as clicks,
    case when count(*) filter (where e.event_type = 'product_view') > 0
      then round(100.0 * count(*) filter (where e.event_type = 'whatsapp_click')
        / count(*) filter (where e.event_type = 'product_view'), 2)
      else 0 end as interest_rate
  from products p join analytics_events e on e.product_id = p.id
  where p.store_id = p_store_id and (p_days is null or e.created_at >= now() - (p_days || ' days')::interval)
  group by p.id, p.name order by clicks desc, views desc limit 10;
$$;
```

Análogas para `get_category_rankings` e `get_collection_rankings`. A UI de filtro de período apenas troca o parâmetro `p_days` passado à RPC — uma única roundtrip por consulta, sem refetch de eventos brutos no client.

---

## 6. Estrutura de Pastas

```
app/                       -- (public) e (admin) route groups + proxy.ts
components/
  ui/                      -- shadcn/ui
  catalog/                 -- product-card, product-gallery, whatsapp-button, category-nav
  admin/                   -- product-form, analytics-ranking-table, period-filter
  shared/
lib/
  supabase/{client,server,middleware}.ts
  store/get-active-store.ts
  analytics/{track.ts,queries.ts}
  whatsapp/build-message.ts   -- mensagem pré-formatada por status do produto
types/database.types.ts   -- gerado via `supabase gen types typescript`
supabase/migrations/
  0001_initial_schema.sql
  0002_updated_at_trigger.sql
  0003_rls_policies.sql
  0004_analytics_rpc.sql
tests/{unit,e2e}/
.env.local / .env.example
```

---

## 7. Milestones

Marcar cada item ao concluir. Atualizar este arquivo incrementalmente — nunca reescrever do zero (regra da seção 19 do PRD).

### M1 — Planejamento
- [x] PRD lido e analisado
- [x] Dúvidas e riscos esclarecidos com o usuário
- [x] `PLAN.md` escrito e aprovado
- [x] `CLAUDE.md` criado com regras permanentes

### M2 — Base do projeto
- [x] Scaffold Next.js (App Router + TypeScript estrito)
- [x] Tailwind CSS configurado
- [x] shadcn/ui instalado
- [x] Estrutura de pastas criada (`app/`, `components/`, `lib/`, `types/`)
- [x] Layouts vazios `(public)` e `(admin)`
- [x] `.env.example` definido
- [x] Teste: build verde / smoke test da rota `/`
- [x] Repositório GitHub criado (`fmindsia-fab/blessing-collection`, branch `main`)
- [x] Projeto Vercel conectado com deploy automático a cada push na `main`

### M3 — Supabase e segurança
- [x] Projeto Supabase criado (`blessing-collection`, região São Paulo)
- [x] Migration `0001_initial_schema.sql` aplicada
- [x] Migration `0002_updated_at_trigger.sql` aplicada
- [x] Migration `0003_rls_policies.sql` aplicada
- [x] Migration `0004_analytics_rpc.sql` aplicada
- [x] `lib/supabase/{client,server,middleware}.ts` configurados
- [x] Conta da owner criada manualmente no Supabase Studio (`blessingbolsas@gmail.com`, loja `blessing-collection`)
- [x] `lib/store/get-active-store.ts` validado (home renderiza `store.name` via RLS pública)
- [x] Teste: anônimo lê produtos/lojas públicas corretamente (RLS confirmada)
- [x] Teste: anônimo insere em `analytics_events` (confirmado — 1 evento gravado via role anon)
- [x] Teste: owner autentica e edita sua própria loja (update confirmado via RLS simulada)
- [x] Skill `supabase-security-audit` executada — sem riscos críticos; 2 riscos médios anotados (owner_all policies usam `for all` incluindo DELETE físico; RPCs sem teste cross-tenant ainda) para revisitar no M7
- [x] Deploy de produção validado na Vercel com env vars reais (`blessing-collection-chi.vercel.app`), home renderizando dados do Supabase

### M4 — Catálogo público
- [x] Rotas públicas (`/`, `/produtos`, `/produtos/[slug]`, `/categorias/[slug]`, `/colecoes/[slug]`)
- [x] Paginação (12 iniciais + "carregar mais") e busca por nome
- [x] Página de produto com galeria e variações
- [x] Botão WhatsApp com mensagem por status
- [x] Tracking dos 4 eventos (`product_view`, `whatsapp_click`, `category_view`, `collection_view`) via `PageViewTracker`/`WhatsappButton`
- [x] Teste: mensagem do WhatsApp correta por status (`available`/`made_to_order`/`sold_out`) — `tests/unit/whatsapp-message.test.ts`
- [x] Teste: `track()` retorna void de forma síncrona, sem bloquear a navegação — `tests/unit/track.test.ts`
- [x] Validado manualmente com 4 produtos de seed: rotas 200, contagem/busca corretos, badges e CTAs por status corretos

### M5 — Painel administrativo
- [x] CRUD de produtos
- [x] CRUD de categorias
- [x] CRUD de coleções
- [x] CRUD de variantes
- [x] Upload de imagens com validação (máx 8/produto, 5MB, JPEG/PNG/WebP, sem SVG/GIF)
- [x] Upload de logo (máx 2MB, sem SVG)
- [x] Marcação de `is_cover`
- [x] Configurações da loja (WhatsApp, redes sociais)
- [x] Configuração de identidade visual: 3 cores da marca (primária, secundária, destaque) + seleção de fonte (lista pré-definida)
- [x] Teste: upload rejeita arquivo inválido — `tests/unit/product-image-upload.test.ts` (SVG, >5MB e arquivo ausente, todos barrados antes do Storage)
- [x] Teste: "excluir" produto seta `status='inactive'`, nunca `DELETE` — `tests/unit/product-soft-delete.test.ts`
- [x] Migrations `0005_storage_policies.sql` / `0006_fix_storage_policies_name_shadowing.sql` aplicadas (policies do bucket `product-images`)

### M6 — Analytics simples
- [x] RPC `get_product_rankings`
- [x] RPC `get_category_rankings`
- [x] RPC `get_collection_rankings`
- [x] Dashboard com indicadores gerais (`/admin`: produtos no catálogo, views, cliques, taxa de interesse + top 5)
- [x] Filtro de período (7/30/90/total) — via `?periodo=`, sem estado no client; padrão 30 dias
- [x] Cálculo de taxa de interesse — `interestRate()` em `lib/analytics/queries.ts`, espelhando o arredondamento da RPC
- [x] Teste: taxa de interesse calculada corretamente para fixture conhecido — `tests/unit/analytics-queries.test.ts`
- [x] Teste: `p_days=7` exclui eventos fora da janela — `tests/unit/analytics-queries.test.ts`
- [x] `next build` verde com `/admin/analytics` registrada; 20 testes passando

**Pendência conhecida (não bloqueia o M6):** `lib/selection/selection-context.tsx:44` dispara erro de lint
`react-hooks/set-state-in-effect` (hidratação do localStorage via `setState` em `useEffect`) — herdado do
commit da seleção múltipla, a resolver no M7.

### M7 — Qualidade e publicação
- [ ] Segunda rodada de `supabase-security-audit` (auditoria final)
- [ ] Revisão de performance de queries (`supabase-postgres-best-practices`)
- [ ] `code-reviewer` geral
- [ ] Deploy Vercel com env vars de produção
- [ ] Checklist da seção 16 do PRD conferido
- [ ] Teste E2E (Playwright): home → produto → clique WhatsApp → link `wa.me` correto

---

## 8. Skills por fase

| Fase | Skill |
|---|---|
| M2, M4, M5 (implementação) | `fullstack-builder` |
| M3 (schema/RLS/RPCs) | `supabase-postgres-best-practices` ao escrever migrations; `supabase-security-audit` ao final |
| M4/M5 (UI) | `ui-ux-designer` |
| M6 (rankings) | `dataviz` |
| M7 (revisão final) | `code-reviewer` + `supabase-security-audit` (segunda auditoria) |

`stripe-integration` não se aplica — fora do escopo do MVP.

---

## 9. Riscos a vigiar

1. RLS mal configurada expondo `analytics_events` a não-owner — mitigado pela policy de SELECT restrita a owner, testada explicitamente no M3.
2. `service_role_key` vazando para o client — não é necessária neste MVP (anon key + RLS cobre tudo); se surgir necessidade futura, isolar em rota server-only sem prefixo `NEXT_PUBLIC_`.
3. N+1 em analytics — mitigado por RPCs agregadas; validar com `EXPLAIN ANALYZE` no M7.
4. Upload de imagem validado só no client — sempre revalidar tipo/tamanho no Server Action/Route Handler antes de gravar no Storage.
5. Todo botão "excluir" do painel deve ser auditado no code review para confirmar que faz `UPDATE status`, nunca `DELETE`.
6. Middleware é só UX — a proteção real de dados é RLS; nunca tratar o redirect do middleware como controle de acesso suficiente.
7. Falha de `STORE_SLUG` ausente/incorreto em produção derruba a aplicação inteira — `get-active-store.ts` deve lançar erro claro e cedo (fail-fast).

---

## 10. Verificação

- **M3:** testar manualmente no SQL Editor do Supabase com `set role anon;` vs `set role authenticated;` (simulando `auth.uid()`) para confirmar cada policy antes de sair do milestone.
- **M4-M6:** rodar a aplicação localmente (`npm run dev`), navegar o fluxo completo como visitante (catálogo → produto → WhatsApp) e como owner (login → CRUD → analytics), conferindo no painel do Supabase que os eventos e alterações batem com o esperado.
- **M7:** `npx playwright test` para o fluxo E2E principal; `next build` sem erros; checklist manual da seção 16 do PRD antes do deploy final na Vercel.

---

## Próximos passos após aprovação

1. Criar `CLAUDE.md` na raiz do projeto com as regras permanentes (stack, convenções, regras do PRD seção 19) para orientar sessões futuras do Claude Code.
2. Iniciar M2 (scaffold do projeto).
