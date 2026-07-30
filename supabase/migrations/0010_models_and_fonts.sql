-- Modelos de produto + fontes ampliadas (pedido do usuário).
--
-- 1) "Modelo" é a terceira dimensão de organização do catálogo (PRD 3.2 e 3.7),
--    ao lado de categoria e coleção: Clutch, Tote, Transversal, Mochila…
--    Mesmo formato das outras duas — slug único por loja, soft delete via status.
-- 2) font_family deixa de ter check com lista fixa: a lista curada passa a ser
--    validada na aplicação (lib/store/fonts.ts), e a loja pode usar uma fonte
--    própria enviada para o Storage.

-- ========== MODELS ==========
create table if not exists models (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  status text not null default 'active' check (status in ('active','archived')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, slug)
);

create index if not exists idx_models_store on models(store_id) where status = 'active';

create trigger trg_models_updated_at before update on models
  for each row execute function set_updated_at();

-- Vínculo com produtos: on delete set null, igual a category_id/collection_id.
alter table products add column if not exists model_id uuid references models(id) on delete set null;
create index if not exists idx_products_model on products(model_id) where status <> 'inactive';

-- ========== RLS DE MODELS ==========
alter table models enable row level security;

create policy "models_public_read_active" on models for select
  using (
    status = 'active'
    and exists (select 1 from stores s where s.id = models.store_id and s.status = 'active')
  );

create policy "models_owner_all" on models for all
  using (exists (
    select 1 from stores s
    where s.id = models.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from stores s
    where s.id = models.store_id and s.owner_user_id = (select auth.uid())));

-- ========== FONTES ==========
-- A lista curada cresceu de 5 para 16 e pode crescer de novo; manter o check
-- em sincronia exigiria uma migration a cada fonte nova. A validação passa a
-- ser feita na aplicação, que já resolve fonte desconhecida com fallback.
alter table stores drop constraint if exists stores_font_family_check;

-- Fonte própria enviada pela proprietária (.woff2 no Storage). Quando presente,
-- tem precedência sobre font_family.
alter table stores add column if not exists custom_font_url text;
alter table stores add column if not exists custom_font_name text;

comment on column stores.font_family is
  'Fonte da lista curada (lib/store/fonts.ts). Desconhecida cai no padrão.';
comment on column stores.custom_font_url is
  'URL pública do .woff2 enviado pela proprietária. Tem precedência sobre font_family.';
