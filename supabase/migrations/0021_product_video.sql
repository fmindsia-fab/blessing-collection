-- Vídeo curto por peça (pedido do usuário) — um vídeo opcional, separado do
-- limite de 8 imagens (PRD 3.7). `video_poster_url` guarda um frame do vídeo
-- capturado no navegador no momento do upload: sem ele a galeria pública
-- teria que baixar o vídeo inteiro só para mostrar uma miniatura estática.
--
-- Duração (até 1 min) é validada no navegador antes do envio — não há como
-- inspecionar o vídeo no Postgres sem uma extensão de processamento de mídia,
-- que seria desproporcional para este uso. O tamanho do arquivo entra como
-- rede de segurança no servidor (lib/products/video-actions.ts).

alter table products add column if not exists video_url text;
alter table products add column if not exists video_poster_url text;

-- Bucket para os vídeos, mesmo padrão de path e RLS dos demais
-- (product-images, brand-fonts): <store_id>/<product_id>/<arquivo>.
insert into storage.buckets (id, name, public)
values ('product-videos', 'product-videos', true)
on conflict (id) do nothing;

create policy "product_videos_storage_public_read"
on storage.objects for select
using (bucket_id = 'product-videos');

create policy "product_videos_storage_owner_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-videos'
  and exists (
    select 1 from stores s
    where s.id::text = (storage.foldername(objects.name))[1]
      and s.owner_user_id = (select auth.uid())
  )
);

create policy "product_videos_storage_owner_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-videos'
  and exists (
    select 1 from stores s
    where s.id::text = (storage.foldername(objects.name))[1]
      and s.owner_user_id = (select auth.uid())
  )
);

create policy "product_videos_storage_owner_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-videos'
  and exists (
    select 1 from stores s
    where s.id::text = (storage.foldername(objects.name))[1]
      and s.owner_user_id = (select auth.uid())
  )
);
