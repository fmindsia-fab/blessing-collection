-- Variação ligada a um material do estoque (pedido do usuário, 24/10/2026).
--
-- Problema: a baixa de estoque (migration 0045) só descontava os materiais da RECEITA da peça
-- (`product_materials`). Uma alça escolhida na variação do pedido (que é um material do cadastro,
-- como "Alça Metal Redonda") não saía do estoque.
--
-- Agora:
--  * `product_variants.material_id` (+ `material_quantity`): o material que a variação usa e quanto
--    (padrão 1 unidade).
--  * `order_item_variants.material_id` (+ `material_quantity`): cópia desse vínculo NO DIA do pedido,
--    como o nome e o acréscimo já são copiados, para a baixa seguir o combinado mesmo que a variação
--    mude depois.
--  * `set_order_status` passa a descontar a receita da peça MAIS os materiais das variações escolhidas.
--
-- Não apaga nem altera dados existentes além de PREENCHER vínculos que estavam vazios:
--  1) liga cada variação a um material de nome IGUAL (ignorando maiúsculas e espaços), só quando existe
--     exatamente um material com esse nome na loja;
--  2) copia o vínculo para as variações já escolhidas em pedidos antigos.

alter table product_variants add column if not exists material_id uuid references materials(id) on delete set null;
alter table product_variants add column if not exists material_quantity numeric(12,3) not null default 1 check (material_quantity > 0);

alter table order_item_variants add column if not exists material_id uuid references materials(id) on delete set null;
alter table order_item_variants add column if not exists material_quantity numeric(12,3) not null default 1 check (material_quantity > 0);

create index if not exists idx_product_variants_material on product_variants(material_id) where material_id is not null;
create index if not exists idx_order_item_variants_material on order_item_variants(material_id) where material_id is not null;

-- 1) Liga variações a materiais de nome igual (só quando não há dúvida: um único material).
update product_variants pv
set material_id = m.id
from products p, materials m
where pv.product_id = p.id
  and pv.material_id is null
  and m.store_id = p.store_id
  and m.status = 'active'
  and lower(btrim(m.name)) = lower(btrim(pv.name))
  and (
    select count(*) from materials m2
    where m2.store_id = p.store_id and m2.status = 'active' and lower(btrim(m2.name)) = lower(btrim(pv.name))
  ) = 1;

-- 2) Pedidos antigos: copia o vínculo para as variações já escolhidas neles.
update order_item_variants oiv
set material_id = pv.material_id,
    material_quantity = pv.material_quantity
from product_variants pv
where oiv.variant_id = pv.id
  and oiv.material_id is null
  and pv.material_id is not null;

-- A função agora desconta também os materiais das variações escolhidas.
create or replace function set_order_status(
  p_store_id uuid,
  p_order_id uuid,
  p_status text,
  p_return_stock boolean default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_consume boolean := false;
  v_return boolean := false;
  v_consumed int := 0;
  v_returned int := 0;
  v_shortages jsonb := '[]'::jsonb;
begin
  if p_status is null or p_status not in ('quote', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled') then
    raise exception 'Situação do pedido inválida.';
  end if;

  select * into v_order from orders where id = p_order_id and store_id = p_store_id for update;
  if not found then
    raise exception 'Pedido não encontrado.';
  end if;

  -- Baixa de insumos (uma vez só por pedido).
  if p_status in ('in_production', 'ready', 'delivered') and v_order.stock_consumed_at is null then
    v_consume := true;
  end if;

  -- Devolução: voltar para antes da produção; ou cancelar pedido que já baixou, se a pessoa pediu.
  if v_order.stock_consumed_at is not null and v_order.status in ('in_production', 'ready', 'delivered') then
    if p_status in ('quote', 'confirmed') then
      v_return := true;
    elsif p_status = 'cancelled' and coalesce(p_return_stock, false) then
      v_return := true;
    end if;
  end if;

  if v_consume then
    with needs as (
      -- Receita da peça (materiais cadastrados na formação de preço) × quantidade pedida.
      select pm.material_id, pm.quantity * oi.quantity as qty
      from order_items oi
      join product_materials pm on pm.product_id = oi.product_id
      where oi.order_id = v_order.id
        and oi.product_id is not null
        and pm.material_id is not null
      union all
      -- Materiais das variações escolhidas (ex.: a alça) × quantidade pedida.
      select oiv.material_id, oiv.material_quantity * oi.quantity as qty
      from order_items oi
      join order_item_variants oiv on oiv.order_item_id = oi.id
      where oi.order_id = v_order.id
        and oiv.material_id is not null
    ),
    consumed as (
      insert into stock_movements (store_id, material_id, kind, quantity, unit_cost, order_id, note)
      select
        v_order.store_id,
        n.material_id,
        'consumption',
        -sum(n.qty),
        m.unit_cost,
        v_order.id,
        'Pedido em produção'
      from needs n
      join materials m on m.id = n.material_id and m.store_id = v_order.store_id
      where m.track_stock
      group by n.material_id, m.unit_cost
      having sum(n.qty) > 0
      returning material_id
    )
    select count(*) into v_consumed from consumed;

    -- Materiais que ficaram com saldo negativo por causa deste pedido (só aviso, nunca trava).
    select coalesce(jsonb_agg(jsonb_build_object('name', m.name, 'unit', m.unit, 'short', -s.stock)), '[]'::jsonb)
    into v_shortages
    from material_stock s
    join materials m on m.id = s.material_id
    where s.store_id = v_order.store_id
      and s.stock < 0
      and s.material_id in (
        select sm.material_id from stock_movements sm where sm.order_id = v_order.id and sm.kind = 'consumption'
      );
  end if;

  if v_return then
    with returned as (
      insert into stock_movements (store_id, material_id, kind, quantity, unit_cost, order_id, note)
      select
        v_order.store_id,
        sm.material_id,
        'return',
        -sum(sm.quantity),
        (array_agg(sm.unit_cost order by sm.created_at desc))[1],
        v_order.id,
        case when p_status = 'cancelled' then 'Pedido cancelado: insumos devolvidos' else 'Pedido voltou: insumos devolvidos' end
      from stock_movements sm
      where sm.order_id = v_order.id and sm.kind in ('consumption', 'return')
      group by sm.material_id
      having sum(sm.quantity) < 0
      returning material_id
    )
    select count(*) into v_returned from returned;
  end if;

  update orders
  set
    status = p_status,
    delivered_at = case when p_status = 'delivered' then now() else null end,
    stock_consumed_at = case
      when v_consume then now()
      when v_return then null
      else stock_consumed_at
    end
  where id = v_order.id;

  return jsonb_build_object('consumed', v_consumed, 'returned', v_returned, 'shortages', v_shortages);
end;
$$;

revoke all on function set_order_status(uuid, uuid, text, boolean) from public, anon;
grant execute on function set_order_status(uuid, uuid, text, boolean) to authenticated;
