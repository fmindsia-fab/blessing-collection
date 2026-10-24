-- Várias variações por item do pedido (pedido do usuário, 24/10/2026).
--
-- Antes, `order_items.variant_id` guardava UMA variação por item. Agora o item pode ter nenhuma,
-- uma ou várias (ex.: uma alça + uma cor + um tassel), como a cliente escolhe no catálogo: uma
-- opção de cada grupo de variação. Só CRIA uma tabela nova e COPIA as variações já existentes
-- para ela: nenhum dado é alterado ou apagado, e `order_items.variant_id` continua existindo
-- (guarda a primeira variação, por compatibilidade).
--
-- O nome, o grupo e o acréscimo ficam copiados no pedido (snapshot): se a variação for renomeada,
-- arquivada ou mudar de preço depois, o pedido antigo continua mostrando o que foi combinado.
--
-- RLS: mesmo padrão de order_items (só a dona do pedido; sem leitura pública).

create table if not exists order_item_variants (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  variant_group text check (variant_group is null or char_length(variant_group) <= 60),
  -- Quanto esta variação somou ao preço da peça, no dia do pedido.
  surcharge numeric(10,2) not null default 0 check (surcharge >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_item_variants_item on order_item_variants(order_item_id);

alter table order_item_variants enable row level security;

create policy "order_item_variants_owner_all" on order_item_variants for all
  using (exists (
    select 1 from order_items oi
    join orders o on o.id = oi.order_id
    join stores s on s.id = o.store_id
    where oi.id = order_item_variants.order_item_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from order_items oi
    join orders o on o.id = oi.order_id
    join stores s on s.id = o.store_id
    where oi.id = order_item_variants.order_item_id and s.owner_user_id = (select auth.uid())));

-- Copia as variações dos pedidos que já existem (uma por item). Pode rodar de novo sem duplicar.
insert into order_item_variants (order_item_id, variant_id, name, variant_group, surcharge, sort_order)
select
  oi.id,
  pv.id,
  left(pv.name, 120),
  left(pv.variant_group, 60),
  case
    when pv.price is not null and p.price is not null then greatest(0, round(pv.price - p.price, 2))
    else 0
  end,
  0
from order_items oi
join product_variants pv on pv.id = oi.variant_id
left join products p on p.id = oi.product_id
where oi.variant_id is not null
  and not exists (select 1 from order_item_variants x where x.order_item_id = oi.id);
