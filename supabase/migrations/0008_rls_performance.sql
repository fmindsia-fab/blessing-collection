-- Otimização de performance da RLS (Milestone 7).
-- As policies chamavam auth.uid() diretamente no predicado, o que faz o
-- Postgres reavaliar a função uma vez por linha. Envolver em (select auth.uid())
-- permite que o planner trate o valor como constante e o avalie uma única vez.
-- Referência: supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations
--
-- Nenhuma regra de acesso muda aqui — o predicado é logicamente idêntico.

-- ===== PROFILES =====
drop policy if exists "profile_select_own" on profiles;
create policy "profile_select_own" on profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "profile_insert_own" on profiles;
create policy "profile_insert_own" on profiles for insert
  with check ((select auth.uid()) = id);

drop policy if exists "profile_update_own" on profiles;
create policy "profile_update_own" on profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ===== STORES =====
drop policy if exists "stores_owner_all" on stores;
create policy "stores_owner_all" on stores for all
  using ((select auth.uid()) = owner_user_id)
  with check ((select auth.uid()) = owner_user_id);

-- ===== CATEGORIES =====
drop policy if exists "categories_owner_all" on categories;
create policy "categories_owner_all" on categories for all
  using (exists (
    select 1 from stores s
    where s.id = categories.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from stores s
    where s.id = categories.store_id and s.owner_user_id = (select auth.uid())));

-- ===== COLLECTIONS =====
drop policy if exists "collections_owner_all" on collections;
create policy "collections_owner_all" on collections for all
  using (exists (
    select 1 from stores s
    where s.id = collections.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from stores s
    where s.id = collections.store_id and s.owner_user_id = (select auth.uid())));

-- ===== PRODUCTS =====
drop policy if exists "products_owner_all" on products;
create policy "products_owner_all" on products for all
  using (exists (
    select 1 from stores s
    where s.id = products.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from stores s
    where s.id = products.store_id and s.owner_user_id = (select auth.uid())));

-- ===== PRODUCT_IMAGES =====
drop policy if exists "product_images_owner_all" on product_images;
create policy "product_images_owner_all" on product_images for all
  using (exists (
    select 1 from products p join stores s on s.id = p.store_id
    where p.id = product_images.product_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from products p join stores s on s.id = p.store_id
    where p.id = product_images.product_id and s.owner_user_id = (select auth.uid())));

-- ===== PRODUCT_VARIANTS =====
drop policy if exists "product_variants_owner_all" on product_variants;
create policy "product_variants_owner_all" on product_variants for all
  using (exists (
    select 1 from products p join stores s on s.id = p.store_id
    where p.id = product_variants.product_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from products p join stores s on s.id = p.store_id
    where p.id = product_variants.product_id and s.owner_user_id = (select auth.uid())));

-- ===== ANALYTICS_EVENTS =====
drop policy if exists "analytics_select_owner_only" on analytics_events;
create policy "analytics_select_owner_only" on analytics_events for select
  using (exists (
    select 1 from stores s
    where s.id = analytics_events.store_id and s.owner_user_id = (select auth.uid())));

-- ===== STORAGE (bucket product-images) =====
drop policy if exists "product_images_storage_owner_insert" on storage.objects;
create policy "product_images_storage_owner_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'product-images'
  and exists (
    select 1 from stores s
    where s.id::text = (storage.foldername(objects.name))[1]
      and s.owner_user_id = (select auth.uid())));

drop policy if exists "product_images_storage_owner_update" on storage.objects;
create policy "product_images_storage_owner_update"
on storage.objects for update to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from stores s
    where s.id::text = (storage.foldername(objects.name))[1]
      and s.owner_user_id = (select auth.uid())));

drop policy if exists "product_images_storage_owner_delete" on storage.objects;
create policy "product_images_storage_owner_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from stores s
    where s.id::text = (storage.foldername(objects.name))[1]
      and s.owner_user_id = (select auth.uid())));

-- ===== ÍNDICE PARA A LISTAGEM PÚBLICA =====
-- A listagem paginada filtra por (store_id, status) e ordena por
-- (sort_order, created_at desc). O índice idx_products_store_status cobre o
-- filtro, mas o Postgres ainda precisa ordenar o resultado. Estender o índice
-- com as colunas de ordenação permite ler já na ordem certa.
create index if not exists idx_products_store_status_sort
  on products(store_id, status, sort_order, created_at desc);
