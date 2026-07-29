-- Row Level Security — Blessing Collection
-- Ver PLAN.md seção 3 para justificativa. Regra geral:
--   - owner autenticada (auth.uid() = owner_user_id, direto ou via subquery) tem acesso total à própria loja.
--   - visitante anônimo só lê registros públicos (status ativo/visível) de uma loja ativa.
--   - analytics_events: anônimo só INSERE (nunca lê); só a owner lê.

alter table profiles enable row level security;
alter table stores enable row level security;
alter table categories enable row level security;
alter table collections enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table analytics_events enable row level security;

-- ===== PROFILES =====
create policy "profile_select_own" on profiles for select
  using (auth.uid() = id);

create policy "profile_insert_own" on profiles for insert
  with check (auth.uid() = id);

create policy "profile_update_own" on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ===== STORES =====
create policy "stores_public_read_active" on stores for select
  using (status = 'active');

create policy "stores_owner_all" on stores for all
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

-- ===== CATEGORIES =====
create policy "categories_public_read_active" on categories for select
  using (
    status = 'active'
    and exists (select 1 from stores s where s.id = categories.store_id and s.status = 'active')
  );

create policy "categories_owner_all" on categories for all
  using (exists (select 1 from stores s where s.id = categories.store_id and s.owner_user_id = auth.uid()))
  with check (exists (select 1 from stores s where s.id = categories.store_id and s.owner_user_id = auth.uid()));

-- ===== COLLECTIONS =====
create policy "collections_public_read_active" on collections for select
  using (
    status = 'active'
    and exists (select 1 from stores s where s.id = collections.store_id and s.status = 'active')
  );

create policy "collections_owner_all" on collections for all
  using (exists (select 1 from stores s where s.id = collections.store_id and s.owner_user_id = auth.uid()))
  with check (exists (select 1 from stores s where s.id = collections.store_id and s.owner_user_id = auth.uid()));

-- ===== PRODUCTS =====
-- Público vê 'available' | 'made_to_order' | 'sold_out'. Só 'inactive' é oculto (confirmado com o usuário).
create policy "products_public_read_visible" on products for select
  using (
    status in ('available','made_to_order','sold_out')
    and exists (select 1 from stores s where s.id = products.store_id and s.status = 'active')
  );

create policy "products_owner_all" on products for all
  using (exists (select 1 from stores s where s.id = products.store_id and s.owner_user_id = auth.uid()))
  with check (exists (select 1 from stores s where s.id = products.store_id and s.owner_user_id = auth.uid()));

-- ===== PRODUCT_IMAGES =====
create policy "product_images_public_read" on product_images for select
  using (
    exists (
      select 1 from products p
      join stores s on s.id = p.store_id
      where p.id = product_images.product_id
        and p.status in ('available','made_to_order','sold_out')
        and s.status = 'active'
    )
  );

create policy "product_images_owner_all" on product_images for all
  using (
    exists (
      select 1 from products p
      join stores s on s.id = p.store_id
      where p.id = product_images.product_id and s.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from products p
      join stores s on s.id = p.store_id
      where p.id = product_images.product_id and s.owner_user_id = auth.uid()
    )
  );

-- ===== PRODUCT_VARIANTS =====
create policy "product_variants_public_read" on product_variants for select
  using (
    exists (
      select 1 from products p
      join stores s on s.id = p.store_id
      where p.id = product_variants.product_id
        and p.status in ('available','made_to_order','sold_out')
        and s.status = 'active'
    )
  );

create policy "product_variants_owner_all" on product_variants for all
  using (
    exists (select 1 from products p join stores s on s.id = p.store_id
      where p.id = product_variants.product_id and s.owner_user_id = auth.uid())
  )
  with check (
    exists (select 1 from products p join stores s on s.id = p.store_id
      where p.id = product_variants.product_id and s.owner_user_id = auth.uid())
  );

-- ===== ANALYTICS_EVENTS =====
-- Anônimo (anon) e autenticado podem APENAS inserir, com campos validados.
-- Nenhuma policy de SELECT existe para não-owner — só a proprietária lê a tabela bruta.
-- Sem policy de UPDATE/DELETE — eventos são imutáveis.
create policy "analytics_insert_validated" on analytics_events for insert
  to anon, authenticated
  with check (
    event_type in ('product_view','whatsapp_click','category_view','collection_view')
    and exists (select 1 from stores s where s.id = analytics_events.store_id and s.status = 'active')
    and (product_id is null or exists (
      select 1 from products p where p.id = product_id and p.store_id = analytics_events.store_id))
    and (category_id is null or exists (
      select 1 from categories c where c.id = category_id and c.store_id = analytics_events.store_id))
    and (collection_id is null or exists (
      select 1 from collections c where c.id = collection_id and c.store_id = analytics_events.store_id))
  );

create policy "analytics_select_owner_only" on analytics_events for select
  using (exists (select 1 from stores s where s.id = analytics_events.store_id and s.owner_user_id = auth.uid()));
