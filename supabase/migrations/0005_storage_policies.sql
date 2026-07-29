-- RLS para o bucket product-images (Milestone 5).
-- Leitura pública (bucket já é público), mas upload/update/delete somente
-- para a proprietária autenticada da loja dona da imagem.
-- Convenção de path: <store_id>/<product_id>/<arquivo>.

create policy "product_images_storage_public_read"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "product_images_storage_owner_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and exists (
    select 1 from stores s
    where s.id::text = (storage.foldername(name))[1]
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
    where s.id::text = (storage.foldername(name))[1]
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
    where s.id::text = (storage.foldername(name))[1]
      and s.owner_user_id = auth.uid()
  )
);
