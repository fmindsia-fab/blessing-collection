-- Bucket para fontes próprias da marca.
-- Leitura pública (o navegador do visitante precisa baixar o arquivo), escrita
-- apenas para a proprietária da loja dona do path — mesma convenção do
-- product-images: <store_id>/<arquivo>.
--
-- O bucket precisa existir antes das policies. Se já tiver sido criado pelo
-- Studio, o on conflict evita erro.
insert into storage.buckets (id, name, public)
values ('brand-fonts', 'brand-fonts', true)
on conflict (id) do nothing;

drop policy if exists "brand_fonts_public_read" on storage.objects;
create policy "brand_fonts_public_read"
on storage.objects for select
using (bucket_id = 'brand-fonts');

drop policy if exists "brand_fonts_owner_insert" on storage.objects;
create policy "brand_fonts_owner_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'brand-fonts'
  and exists (
    select 1 from stores s
    where s.id::text = (storage.foldername(objects.name))[1]
      and s.owner_user_id = (select auth.uid())));

drop policy if exists "brand_fonts_owner_update" on storage.objects;
create policy "brand_fonts_owner_update"
on storage.objects for update to authenticated
using (
  bucket_id = 'brand-fonts'
  and exists (
    select 1 from stores s
    where s.id::text = (storage.foldername(objects.name))[1]
      and s.owner_user_id = (select auth.uid())));

drop policy if exists "brand_fonts_owner_delete" on storage.objects;
create policy "brand_fonts_owner_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'brand-fonts'
  and exists (
    select 1 from stores s
    where s.id::text = (storage.foldername(objects.name))[1]
      and s.owner_user_id = (select auth.uid())));
