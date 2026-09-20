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
- [x] Upload de logo (máx 2MB, sem SVG) — `uploadStoreLogo` em `lib/store/actions.ts`, exibido no hero da home
- [x] Marcação de `is_cover`
- [x] Configurações da loja (WhatsApp, redes sociais)
- [x] Configuração de identidade visual: 3 cores da marca (primária, secundária, destaque) + seleção de
      fonte (lista pré-definida) — `lib/store/{branding,fonts}.ts`, aplicadas no layout público como
      CSS variables (`--brand-primary/secondary/accent`) e `--font-brand`
- [x] Teste: logo rejeita SVG e arquivo >2MB — `tests/unit/store-logo-upload.test.ts`
- [x] Teste: cor hex inválida é rejeitada; fonte desconhecida cai no padrão — `tests/unit/branding.test.ts`
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
- [x] Segunda rodada de `supabase-security-audit` (auditoria final) — 0 riscos críticos; 3 médios tratados (ver abaixo)
- [x] Revisão de performance de queries (`supabase-postgres-best-practices`)
- [x] Teste E2E (Playwright): home → produto → clique WhatsApp → link `wa.me` correto — `tests/e2e/catalog-whatsapp.spec.ts`, 4 testes passando **contra produção**
- [x] Lint pendente de `selection-context.tsx` resolvido (`useSyncExternalStore` + init preguiçosa, sem setState em efeito)
- [x] Migrations `0007` e `0008` aplicadas no Supabase — check constraint de `product_variants` confirmado
      pelo usuário via `pg_get_constraintdef` incluindo `'archived'`
- [x] Deploy Vercel com env vars de produção — commit `e5d9463`, build 35s, E2E 4/4 contra produção
- [x] `code-reviewer` geral — 2 divergências de comportamento anotadas abaixo (seleção múltipla), aguardando decisão
- [x] Revisão do `PLAN.md` item a item contra o código real — 2 itens do M5 estavam marcados como
      concluídos sem implementação (identidade visual e upload de logo); ambos implementados nesta rodada
- [x] Checklist da seção 16 do PRD conferido — PRD salvo em `PRD.md` (antes fora do repositório).
      20 dos 22 critérios verificados; 2 dependem de conferência manual sua (ver abaixo)

**Checklist da seção 16 do PRD — resultado:**

| Critério | Status |
|---|---|
| Catálogo em celular/tablet/desktop | ✅ classes responsivas em todas as rotas |
| Visitantes acessam sem conta | ✅ E2E |
| Busca funciona | ⚠️ busca por nome OK; **filtros por cor/modelo/disponibilidade não existem** (PRD 3.2) |
| Cada produto tem URL própria | ✅ `/produtos/[slug]` |
| Produtos aceitam várias imagens | ✅ até 8, validado no servidor |
| Produtos inativos não aparecem | ✅ confirmado via API anon: 3 `inactive` ocultos |
| Produtos esgotados identificados | ✅ badge + CTA "Consultar disponibilidade" |
| Botão do WhatsApp abre mensagem correta | ✅ E2E + teste unitário por status |
| Proprietária consegue login | ✅ `/login` + Supabase Auth |
| Proprietária administra o catálogo | ✅ CRUD completo no painel |
| Não autenticados não acessam o painel | ✅ E2E (307 → `/login`) |
| Uma loja não acessa dados de outra | ✅ RLS + filtro `store_id` nas actions |
| RLS bloqueia acessos indevidos | ✅ auditoria M7 |
| Credenciais privadas fora do frontend | ✅ nenhuma `service_role_key`; `.env*` ignorado |
| Visualizações registradas | ✅ dashboard com dados reais |
| Cliques no WhatsApp registrados | ✅ dashboard com dados reais |
| Dashboard apresenta totais corretos | ✅ conferido pelo usuário (8 cliques / 17 views / 47,06%) |
| Rankings respeitam o período | ✅ teste unitário da janela `p_days` |
| Taxa de interesse correta | ✅ teste com fixture conhecido |
| Relatório não exibe dados pessoais | ✅ `analytics_events` sem IP/UA/identificador |
| Falhas no analytics não bloqueiam | ✅ `track()` fire-and-forget, teste unitário |
| Sem erros críticos no build | ✅ `next build` verde |

**Correção de acessibilidade aplicada:** `app/layout.tsx` declarava `lang="en"` num site todo em
português — leitores de tela usariam fonética inglesa. Corrigido para `pt-BR` (PRD seção 15).

**Lacuna de escopo encontrada no checklist:** o PRD seção 3.2 pede filtros por **categoria, coleção,
modelo, cor e disponibilidade** na listagem. Hoje existe busca por nome e navegação por categoria/coleção
via rota própria, mas não há filtros por cor, modelo ou disponibilidade — e "modelo" nem existe como
entidade no schema. Fora do que foi implementado; requer decisão de escopo.

**Responsividade verificada** no M8: renderização a 390px conferida em produção — filtros quebram em
várias linhas sem estourar, grade em 2 colunas, tipografia legível.

**Navegação por teclado verificada** no M9: todo elemento interativo tem `focus-visible` com anel dourado
e `ring-offset`, conferido visualmente no CTA sólido (onde o anel corre o risco de sumir contra o fundo
escuro). Fecha o último critério de acessibilidade do PRD seção 15 que dependia de conferência manual.

**Achados do code review — resolvidos:**

1. ~~Produtos esgotados entram na seleção múltipla sem sinalização.~~ **Resolvido:** o item da seleção passa
   a carregar o `status` e a mensagem do WhatsApp sinaliza cada peça — "(esgotada — gostaria de saber sobre
   reposição)" / "(sob encomenda)". A peça continua selecionável, como você decidiu.
2. ~~O total da seleção ignora preços de variante.~~ **Resolvido:** a seleção guarda o menor preço (base ou
   variante mais barata) e o total exibe "a partir de" quando alguma peça tem variante com preço próprio.

### M8 — Filtros, paleta e redesign (pedido do usuário, pós-M7)

- [x] Filtro por **cor** na listagem (join com `product_variants.color`, desduplicado) — PRD 3.2
- [x] Filtro por **disponibilidade** (subconjunto dos status públicos, nunca amplia o que o visitante vê)
- [x] Paleta da marca com **até 5 cores** e campo hex colável (aceita `c9a227`, `#C9A227`, com/sem espaço)
- [x] Migration `0009_brand_palette.sql`: coluna `brand_colors text[]` + check de 1 a 5 cores hex válidas
- [x] Redesign do catálogo público e do painel (direção: editorial de moda impresso)
- [x] Testes: paleta (normalização, validação, fallback) e sinalização de status na mensagem — 46 no total
- [x] Migration `0009` aplicada e confirmada (`brand_colors` migrou os valores das 3 colunas antigas)
- [x] Deploy validado em produção: E2E 4/4, paleta e utilitários editoriais no HTML, mobile 390px conferido
- [x] Filtro por **modelo** — implementado no M11: tabela `models` (migration `0010`), CRUD em
      `/admin/modelos`, `model_id` em `products` e filtro na listagem. O filtro público só exibe
      modelos que têm peças, com a contagem de cada um.

### M11 — Ajustes pós-publicação

- [x] Modelos, fontes ampliadas (16 curadas + upload de `.woff2`), compartilhamento e acesso ao painel
- [x] Limite de imagem 5MB → 10MB (PRD 13.1 atualizado)
- [x] SEO técnico: `sitemap.xml` gerado do banco, `robots.txt`, metadata das rotas públicas
- [x] Acesso discreto ao painel: 5 cliques no fio do rodapé (o link visível anunciava o painel a quem
      recebesse o catálogo compartilhado)
- [x] Produtos relacionados (PRD 3.4) e `alt_text` por imagem (PRD 15)
- [x] Reordenar imagens e produtos (PRD 3.7) — botões em vez de arrastar, operável por toque e teclado
- [x] Peso e dimensões em campos numéricos (migration `0012`), exibidos em "Mais detalhes";
      o campo `measurements` de texto livre saiu do cadastro e do catálogo por redundância
- [x] Galeria: miniatura troca a foto principal e a foto abre em tela cheia (portal no `body`, porque o
      container `sticky` prendia o `fixed` à coluna)
- [x] `refreshProductSlug`: botão para regenerar a URL quando o nome muda, por ação explícita —
      trocar sozinho quebraria links já enviados a clientes
- [x] Filtros só listam opções com resultado, com contagem por opção

**Pendências de conteúdo (bloqueiam a divulgação, não o código):**

1. Produto **"Clutch nome novo"** com descrição `asdqweasdzxcasdqwe` e slug `/produtos/teste-novo-produto`
   — dado de teste, público e no sitemap.
2. **Nenhuma das 5 imagens tem `alt_text`** preenchido. O campo existe no painel desde o M11; o `alt` cai
   no nome do produto, o que funciona mas não descreve a foto (PRD 15).
3. **Nenhum `seo_description`** preenchido — a metadata cai na descrição do produto.

### M12 — Controle de pedidos (encomendas)

Extensão de escopo aprovada pelo usuário sobre o PRD (seção 5.2 excluía "controle financeiro" e
"controle avançado de estoque" do MVP): este milestone é um controle de **encomendas** — cliente,
itens, prazos e pagamento (sinal/saldo) de pedidos já fechados via WhatsApp — não um financeiro
completo (sem contas a pagar/fluxo de caixa) nem estoque (sem baixa automática de insumo).

Decisões confirmadas com o usuário antes de implementar:
- Item do pedido pode ser um produto do catálogo (com variante opcional) ou avulso/personalizado
  (nome digitado na hora), cobrindo encomenda sob medida fora do catálogo.
- Cliente vira cadastro próprio (`customers`), com histórico de pedidos, não texto solto no pedido.
- Pagamento em sinal + saldo (valor/data/forma de pagamento para cada um), reaproveitando
  `payment_methods` já existente (migration 0014).
- Fluxo de status completo: orçamento → confirmado → em produção → pronto → entregue / cancelado.
- Lista de produção é **derivada automaticamente**: soma os `product_materials` (migration 0014,
  já usados na ficha de "Formação de preço" de cada produto) multiplicados pela quantidade
  encomendada, agregando por material entre os itens do pedido — mais um campo de texto livre
  (`production_notes`) para insumo extra fora do cadastro.
- Único extra de boas práticas aceito além do pedido original: alerta de pedidos atrasados
  (previsão de entrega vencida sem status entregue/cancelado) na lista de pedidos. Descartados:
  timeline de mudança de status, número sequencial do pedido, e vínculo com analytics — mantidos
  fora por decisão explícita do usuário.

- [x] Migration `0025_orders.sql`: `customers`, `orders`, `order_items` — RLS só para a dona
      (mesmo padrão de `payment_methods`/`product_materials`: dado de negócio sensível, sem
      policy pública de leitura)
- [x] `lib/customers/{queries,actions}.ts` — CRUD com soft delete (`status`) via `toggleCustomer`
- [x] `lib/orders/{queries,actions}.ts` — criação/edição de pedido com itens, cálculo de
      `total_amount`, mudança de status, lista de produção agregada (`getOrderProductionList`)
- [x] Rotas admin: `/admin/pedidos` (lista + filtro de status + busca por cliente + alerta de
      atraso), `/admin/pedidos/novo`, `/admin/pedidos/[id]` (detalhe + lista de produção),
      `/admin/pedidos/[id]/editar`, `/admin/pedidos/calendario` (visão mensal por previsão de
      entrega), `/admin/clientes` (lista + cadastro), `/admin/clientes/[id]` (edição + histórico)
- [x] `types/database.types.ts`: tipos de `customers`, `orders`, `order_items` e `OrderStatus`
- [x] Nav do painel atualizada com "Pedidos" e "Clientes"
- [x] `next build` verde, `tsc --noEmit` e `eslint` sem erros nos arquivos novos

- [x] Migration `0025_orders.sql` aplicada em produção (usuário confirmou via SQL Editor do
      Supabase Studio)
- [x] Cálculo de total do pedido e agregação da lista de produção extraídos para
      `lib/orders/calculate.ts` (funções puras, mesmo padrão de `lib/pricing/calculate.ts`) e
      reaproveitados em `actions.ts`/`queries.ts`
- [x] Teste: total do pedido soma quantidade × preço por item — `tests/unit/orders-calculate.test.ts`
- [x] Teste: lista de produção multiplica material pela quantidade encomendada, soma entre peças
      diferentes do mesmo pedido e ignora produto fora do pedido — `tests/unit/orders-calculate.test.ts`
- [x] `next build`, `tsc --noEmit` e suíte completa (226 testes) verdes após o milestone

**Validado pelo usuário em produção:** fluxo de criação de pedido funcionando.

**Bug corrigido pós-validação:** o formulário de pedido não salvava o produto selecionado no item —
os campos (select de produto, quantidade, preço) eram controlados por state mas só enviavam valor via
`<input type="hidden">` paralelo, que dessincronizava do state em alguns casos. Corrigido passando
`name` direto aos campos visíveis, removendo os hidden inputs espelhados como fonte de verdade
paralela (commit `dcd106a`). Também corrigido: `listOrders`/`getOrder`/`getOrderProductionList`
ignoravam o campo `error` do Supabase e retornavam vazio sem log algum — agora logam no servidor.

**Máscara de telefone** adicionada ao cadastro/edição de cliente (`(DD) 9XXXX-XXXX`), com
`lib/customers/phone-mask.ts` e teste unitário — pedido do usuário após o primeiro teste em produção.

### M13 — Kanban de pedidos (pedido do usuário, pós-M12)

- [x] `/admin/pedidos` passa de lista para **Kanban por status** (uma coluna por status do fluxo),
      substituindo a lista — decisão do usuário
- [x] Arraste entre colunas com **HTML Drag and Drop API nativa**, mesmo padrão de
      `app/(admin)/admin/produtos/sortable-list.tsx` (sem biblioteca — regra do CLAUDE.md de não
      adicionar dependência sem necessidade real). Move otimisticamente no client e reconcilia via
      `revalidatePath` dentro de `updateOrderStatus`, que já existia da tela de detalhe
- [x] Card da coluna **Orçamento** tem atalho de edição (ícone de lápis) direto para
      `/admin/pedidos/[id]/editar` — decisão do usuário: atalho para a tela já existente, não edição
      inline no card
- [x] `orders-list.tsx` removido (substituído por `orders-kanban.tsx`); acessibilidade sem drag
      permanece coberta pelos botões de status já existentes na tela de detalhe do pedido
- [x] `next build`, `tsc --noEmit`, `eslint` e suíte completa (232 testes) verdes

**Correções pedidas após o primeiro uso em produção:**
- [x] Telefone sem máscara aparecendo em 3 lugares que exibiam `customer.phone` cru do banco
      (tela de detalhe do pedido, lista de clientes, seletor de cliente no formulário de pedido) —
      a máscara só formatava durante a digitação; números já salvos (ou digitados antes da máscara
      existir) precisam de `formatPhoneBR` também na leitura, não só na entrada
- [x] Paleta do tema escuro trocada de "café escuro adaptado ao editorial" para **cinza neutro
      puro**, sem nenhuma relação com a identidade visual da loja — a primeira tentativa de honrar
      a linguagem da marca no escuro ficou estranha visualmente; decisão do usuário: escuro do
      painel é neutro, período

**Ajustes pedidos após o primeiro uso do Kanban:**
- [x] Visual dos cards/colunas refinado (achatado demais na primeira versão): borda tracejada nas
      colunas, destaque dourado + leve zoom na coluna sob o card arrastado, cards com sombra que
      cresce no hover, leve rotação/escala/opacidade durante o arraste
- [x] Animação ao soltar o card na nova coluna (`@keyframes kanban-pop` em `globals.css`) —
      respeita `prefers-reduced-motion` (já zerado globalmente para toda animação/transição)
- [x] **Tema escuro do painel administrativo** (`/admin/*` apenas — decisão do usuário: o catálogo
      público mantém sempre a identidade visual da loja, nunca varia). Toggle no header
      (`theme-toggle.tsx`), preferência em `localStorage` (não é dado de negócio, sem banco).
      `lib/store/dark-mode.ts` repete os valores de `.dark` (globals.css) para sobrescrever via
      `style` inline no wrapper do admin: `buildStoreTheme` já define `--background`/`--foreground`/
      etc via `style` inline no `<body>` (para refletir a paleta da loja), e inline sempre vence
      regra de classe para a mesma custom property — a classe `.dark` sozinha não venceria isso.
- [x] `theme-provider.tsx` segue o mesmo padrão de `lib/selection/selection-context.tsx`
      (`useSyncExternalStore` + inicialização preguiçosa no `useState`, sem `setState` em efeito)
      — lint `react-hooks/set-state-in-effect` pego e corrigido antes do commit
- [x] `next build`, `tsc --noEmit`, `eslint` e suíte completa (232 testes) verdes

**Correções pedidas após o primeiro uso do tema escuro:**
- [x] Paleta do escuro trocada de "café escuro adaptado ao editorial" para **cinza neutro puro**,
      sem nenhuma relação com a paleta da marca — a primeira tentativa de honrar a linguagem da
      marca no escuro ficou estranha; decisão do usuário: escuro do painel é neutro, período
- [x] **Bug crítico corrigido: texto quase invisível no escuro.** Qualquer texto sem classe de cor
      própria (a maioria das células de tabela, por exemplo) herdava o `color` já computado no
      `<body>` pelo tema claro da loja — `color` é herdado pelo valor *resolvido*, não recalculado
      por elemento via `var(--foreground)`. O wrapper do dark mode só sobrescrevia a variável CSS,
      nunca aplicava `color`/`background-color` de fato ali. Corrigido adicionando
      `text-foreground bg-background` explícitos no wrapper (`theme-provider.tsx`), forçando a
      reavaliação da variável no ponto onde ela já tinha sido sobrescrita.

**Pedidos seguintes (miniatura, cliente inline):**
- [x] Card do Kanban ganhou miniatura (capa `is_cover` do primeiro item do catálogo do pedido) e
      nome do(s) produto(s) — `attachItemsSummary` em `lib/orders/queries.ts` busca isso para
      todos os pedidos da tela numa única query (sem N+1). Item avulso sem produto fica sem
      miniatura ("s/foto") — decisão do usuário: só puxa foto do catálogo, sem upload próprio
- [x] Tela de detalhe do pedido também ganhou miniatura por item (`getOrder` agora inclui
      `coverImageUrl` por item, mesma fonte)
- [x] Atalho **"+ Nova cliente"** no formulário de pedido (`new-customer-inline.tsx`): expande um
      mini-formulário (nome + telefone) sem sair da tela; `createCustomerInline` em
      `lib/customers/actions.ts` retorna o registro criado para o `<select>` de cliente já
      selecionar automaticamente — decisão do usuário: inline, não abrir aba separada (o
      `<select>` de cliente precisou virar controlado por state para isso)
- [x] Lista de clientes ganhou link "Editar" explícito ao lado de "Arquivar" (antes só o nome era
      clicável para editar, pouco óbvio) — a tela de edição já existia desde o M12
- [x] `next build`, `tsc --noEmit`, `eslint` e suíte completa (232 testes) verdes

**Calendário redesenhado:**
- [x] Grade com navegação "Anterior/Hoje/Próximo" (`ActionLink`, ícones), dia atual destacado em
      dourado, células preenchidas até fechar semanas completas de 7 colunas
- [x] Cada pedido no dia mostra cliente **e** nome do(s) produto(s) (via `attachItemsSummary`,
      reaproveitado de `listOrders`), com um indicador de cor sutil por status; clique no card leva
      direto ao pedido (já era `<Link>`, só reforçado visualmente)
- [x] `listOrdersForMonth` passou a chamar `attachItemsSummary` — mesma função usada no Kanban,
      sem N+1
- [x] `next build`, `tsc --noEmit`, `eslint` e suíte completa (232 testes) verdes

**Correções pedidas após uso do atalho "+ Nova cliente":**
- [x] Layout do mini-formulário apertado demais (grid de 3 colunas espremido dentro de uma coluna
      de 1/3 do form de pedido, campos com 1-2 caracteres visíveis) — trocado para empilhado
      verticalmente (nome, telefone, botão), que cabe bem em qualquer largura de coluna
- [x] **Bug crítico corrigido: botão "Salvar" não salvava nada.** `NewCustomerInline` usava seu
      próprio `<form action={...}>`, mas esse componente vive dentro do `<form>` do pedido inteiro
      (`order-form.tsx`) — HTML não permite formulário aninhado dentro de outro formulário, e o
      clique era capturado pelo form externo (de pedido) em vez de disparar o cadastro da cliente.
      Corrigido removendo o `<form>` interno: a Server Action agora é chamada diretamente num
      `onClick` (via `useTransition`, com os campos em `useState` em vez de `FormData` do form)

**Ordenação do Kanban:** `listOrders` passou a ordenar por `expected_delivery_date` ascendente
(entrega mais próxima primeiro, `nullsFirst: false` — sem previsão vai para o final da coluna, não
some no meio), com `order_date` desc como desempate. Cada coluna do Kanban filtra preservando essa
ordem (`Array.filter` não reordena) — pedido do usuário, entregas mais urgentes ficam no topo.

### M14 — Dashboard financeiro e gerencial de pedidos (pedido do usuário, pós-M13)

Decisões confirmadas com o usuário antes de implementar:
- Rota separada `/admin/pedidos/dashboard` (não uma seção dentro do Kanban) — mantém o Kanban
  focado no operacional, dashboard focado em análise, com link entre as duas telas.
- **Recebido** = soma de sinal/saldo com data de pagamento preenchida (`deposit_paid_at`/
  `balance_paid_at`), independente do status do pedido. **A receber** = soma do que falta pagar,
  só em pedidos não cancelados. **Ticket médio** = valor total (pago ou não) ÷ pedidos não
  cancelados no período.
- **Materiais a comprar**: soma de `product_materials` (mesma fonte da lista de produção do
  pedido) de pedidos estritamente em status "Confirmado" — decisão do usuário: não inclui "Em
  produção" (que já pode ter material comprado). Este indicador não respeita o filtro de período
  (é sempre "agora", não faz sentido limitar por data de criação do pedido).
- Extras aceitos: ticket médio, card de pedidos atrasados (reaproveitando a mesma regra do alerta
  já existente na tela de Pedidos) e filtro de período (7/30/90/total, mesmo padrão do dashboard
  de analytics do PRD) — filtra por `order_date`, todo o resto do dashboard exceto materiais.

- [x] `lib/orders/dashboard-calculate.ts`: funções puras testáveis (`calculateFinancialSummary`,
      `calculateStatusBreakdown`, `calculateTopEntries`) — mesmo padrão de `orders/calculate.ts`
- [x] `lib/orders/dashboard-queries.ts`: `getOrderDashboardData` busca os pedidos do período uma
      única vez e agrega tudo em memória com as funções puras (mais simples que uma RPC por
      indicador para o volume de pedidos de uma loja pequena); `getMaterialsToBuy` reaproveita
      `calculateProductionList` de `orders/calculate.ts` somando entre todos os pedidos confirmados
- [x] `components/admin/period-filter.tsx` generalizado (genérico em `T`, `periods`/`labels` agora
      obrigatórios em vez de default fixo em `AnalyticsPeriod`) para ser reaproveitado pelo
      dashboard de pedidos sem duplicar o componente — os 2 usos existentes (dashboard geral e
      `/admin/analytics`) atualizados para passar `periods`/`labels` explicitamente
- [x] Rota `/admin/pedidos/dashboard`: cards de indicadores (pedidos no período, recebido, a
      receber, ticket médio), alerta de atraso, contagem+valor por status, top 5 produtos, top 5
      clientes, lista de materiais a comprar — link "Dashboard" adicionado na tela de Pedidos
- [x] Teste: recebido/a receber por data de pagamento, pedido cancelado não entra na conta, ticket
      médio sem dividir por zero — `tests/unit/orders-dashboard-calculate.test.ts`
- [x] Teste: agregação de status, top entries ordenado por contagem com desempate por valor e
      limitado ao N pedido — mesmo arquivo
- [x] `next build`, `tsc --noEmit`, `eslint` e suíte completa (239 testes) verdes

**Correção pedida após primeiro uso: "Recebido" e "Pedidos por status" não batiam.** No print de
validação, "Recebido" (R$ 529,80) não tinha relação com a soma de "Pedidos por status" (R$ 1039,40)
nem com "A receber" (R$ 0,00) — porque o financeiro somava `deposit_amount + balance_amount`
(campos de sinal/saldo do pedido) enquanto o resto do dashboard usa `total_amount` (soma dos
itens): duas fontes de valor independentes que só coincidem se sinal+saldo forem preenchidos
cobrindo exatamente o total do pedido, o que não é garantido pelo formulário. Decisão do usuário:
`total_amount` é sempre a referência do pedido; sinal/saldo passam a registrar só COMO e QUANDO foi
pago, nunca um valor financeiro à parte — `calculateFinancialSummary` agora limita o "pago" de cada
pedido ao seu `total_amount` (`Math.min`), e "a receber" é sempre `total − pago`, por pedido. Dois
testes novos cobrem exatamente o cenário do bug (sinal+saldo abaixo do total; pago maior que o
total por erro de digitação não deixa "a receber" negativo) — `tests/unit/orders-dashboard-calculate.test.ts`.

**Rastreabilidade do "A receber":** depois de validar a correção acima, o usuário estranhou o
valor de "Recebido" não corresponder a um único pedido que lembrava ter marcado como pago —
investigação confirmou que eram dois pedidos com pagamento parcial somados (dado correto, não
bug), mas expôs que o card agregado não permitia conferir quais pedidos o compunham. Adicionado
`calculatePendingPayments` (lista pedidos não cancelados com saldo pendente, maior primeiro) e uma
seção "Pagamentos pendentes" no dashboard com link direto para cada pedido — 2 testes novos
(`tests/unit/orders-dashboard-calculate.test.ts`, 243 testes na suíte completa).

### M15 — Compartilhar produto individual (pedido do usuário)

- [x] Botão "Compartilhar" na página pública de cada produto (`ProductPurchase`), ao lado de
      "Encomendar esta peça"/"Adicionar à seleção" — reaproveita `ShareButton`
      (`components/shared/share-button.tsx`) já existente (usado no rodapé para compartilhar o
      catálogo inteiro), sem componente novo
- [x] Mensagem inclui a variação escolhida quando houver (`selectionLabel`), consistente com a
      mensagem que o botão do WhatsApp já monta para o mesmo produto
- [x] `next build`, `tsc --noEmit`, `eslint` e suíte completa (243 testes) verdes

### M9 — Sistema de botões, links e setas

- [x] `components/ui/action.tsx`: vocabulário único de ações (`solid`, `outline`, `quiet`, `underline`,
      `ghost`) — as mesmas ~8 classes estavam repetidas em 11 lugares e já divergiam entre telas
      (alturas 11/12, tracking 0.16/0.18, hover ora dourado ora não)
- [x] `components/ui/arrow.tsx`: seta em SVG traçado no lugar do caractere `→`, cujo desenho e peso
      mudavam conforme a fonte escolhida pela proprietária. A haste se estende no hover — o movimento
      vem do traço, não de deslocar o ícone
- [x] `components/ui/button.tsx` (shadcn) realinhado ao editorial: cantos retos, versalete no lugar do
      semibold, alturas maiores, foco dourado. Nomes de variantes/tamanhos preservados para não quebrar
      os 12 arquivos do painel que já o usavam
- [x] `focus-visible` com anel dourado e offset em **todo** elemento interativo (links, chips de filtro,
      cards, nav do painel, botão flutuante) — antes vários tinham apenas `outline-none`
- [x] `BackLink` saiu do `zinc` hardcoded (fora da paleta) para versalete + seta espelhada

**Direção visual adotada:** base pergaminho quente (`oklch(0.985 0.005 75)`) em vez de branco puro, texto
em marrom-tinta, dourado envelhecido como único acento, cantos quase retos (`--radius: 0.25rem`), grão
sutil de papel no fundo. Tipografia serifada da marca nos títulos, versaletes espaçados nos rótulos.
O CTA do WhatsApp deixou de usar o verde da marca de terceiro — passa a ser sólido escuro, coerente com
o editorial. Grades usam `auto-fill` com largura máxima para não esticar os cards quando há poucas peças.

**Correções aplicadas na auditoria final:**

1. **Server Actions confiavam em IDs vindos do formulário.** `updateProduct`, `deactivateProduct`,
   `restoreProduct`, as actions de categoria/coleção e as de imagem/variante filtravam só por `.eq("id", …)`.
   A RLS já bloqueava o abuso, mas era a única camada. Agora todas filtram também por `store_id`
   (regra do CLAUDE.md), e as de imagem/variante validam que o produto pertence à loja ativa antes de
   qualquer escrita. `updateStoreSettings` deixou de receber `storeId` do client — resolve pelo `STORE_SLUG`.
2. **`deleteVariant` fazia DELETE físico** (risco 5 do PLAN.md). Migration `0007` adiciona `'archived'` ao
   check de `product_variants.status`; a action virou `archiveVariant` (UPDATE), e a policy pública de
   SELECT passou a excluir variantes arquivadas.
3. **Policies chamavam `auth.uid()` por linha.** Migration `0008` envolve todas em `(select auth.uid())`,
   avaliado uma única vez pelo planner. Nenhuma regra de acesso muda — o predicado é logicamente idêntico.
   A mesma migration adiciona `idx_products_store_status_sort` para a listagem pública ler já ordenada.

**Exceção consciente registrada:** `deleteProductImage` continua fazendo DELETE físico. A imagem é um
arquivo no Storage, não um registro de negócio com histórico — manter a linha órfã apontando para um
arquivo removido só quebraria a galeria.

**Verificado e sem ressalvas:** RLS ativa nas 8 tabelas, sem policy com `true`; `analytics_events` só
aceita INSERT de `anon` (sem SELECT/UPDATE/DELETE) e não guarda dado pessoal; nenhuma `service_role_key`
no código; `.env*` ignorado e nenhum `.env` rastreado no git; uploads revalidados no servidor
(tipo/tamanho/limite de 8); sem N+1 nas listagens (capas resolvidas em um único `.in()`).

**Não auditável daqui:** o estado real do banco em produção — o Supabase CLI não está autenticado nesta
máquina (`supabase login` é interativo). Confirmar no Studio que as migrations `0001`–`0008` estão
aplicadas e que o bucket `product-images` é público de propósito (é: as imagens do catálogo precisam disso).

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
