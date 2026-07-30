-- Soft delete de variantes (Milestone 7 — auditoria de segurança).
-- A action deleteVariant fazia DELETE físico, contrariando a regra do PRD
-- "sem exclusão definitiva". Variantes não tinham status arquivável — só
-- 'available'/'sold_out' — então o status ganha 'archived' e a action passa
-- a fazer UPDATE, como produtos e categorias já faziam.

alter table product_variants drop constraint if exists product_variants_status_check;

alter table product_variants add constraint product_variants_status_check
  check (status in ('available','sold_out','archived'));

-- A policy pública de SELECT em product_variants não filtra por status hoje
-- (herda a visibilidade do produto). Variante arquivada não pode aparecer no
-- catálogo público, então a policy é recriada excluindo 'archived'.
drop policy if exists "product_variants_public_read" on product_variants;

create policy "product_variants_public_read" on product_variants for select
  using (
    status <> 'archived'
    and exists (
      select 1 from products p
      join stores s on s.id = p.store_id
      where p.id = product_variants.product_id
        and p.status in ('available','made_to_order','sold_out')
        and s.status = 'active'
    )
  );
