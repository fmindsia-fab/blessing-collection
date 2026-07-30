-- Corrige a migration 0005: dentro da subquery `from stores s`, o
-- identificador `name` era resolvido como `s.name` (o nome da loja), e não
-- como `objects.name` (o path do arquivo). A policy comparava store_id com
-- a primeira pasta do nome da loja, que nunca bate — todo upload autenticado
-- era rejeitado com 403 "new row violates row-level security policy".
-- A correção qualifica explicitamente `objects.name`.

drop policy if exists "product_images_storage_owner_insert" on storage.objects;
drop policy if exists "product_images_storage_owner_update" on storage.objects;
drop policy if exists "product_images_storage_owner_delete" on storage.objects;

create policy "product_images_storage_owner_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and exists (
    select 1 from stores s
    where s.id::text = (storage.foldername(objects.name))[1]
      and s.owner_user_id = auth.uid()
  )
);

create policy "product_images_storage_owner_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from stores s
    where s.id::text = (storage.foldername(objects.name))[1]
      and s.owner_user_id = auth.uid()
  )
);

create policy "product_images_storage_owner_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from stores s
    where s.id::text = (storage.foldername(objects.name))[1]
      and s.owner_user_id = auth.uid()
  )
);
