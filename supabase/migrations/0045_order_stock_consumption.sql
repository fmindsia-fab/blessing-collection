-- M19: baixa automática de insumos por pedido (plano em docs/plano-estoque-financeiro-funil.md).
--
-- Só acrescenta uma coluna em `orders` e cria uma função: nenhum dado existente é alterado.
--
-- `set_order_status` troca a situação do pedido E faz a baixa/devolução de estoque na MESMA
-- transação, para status e estoque nunca ficarem desencontrados. É SECURITY INVOKER: a RLS do
-- usuário continua valendo (só a dona do pedido consegue).
--
-- Regras (decisões aprovadas, seção 9 do plano):
--  * Baixa: ao ir para Em produção. Se o pedido pular direto para Pronto ou Entregue sem passar
--    por produção, a baixa também acontece (senão ela se perderia). Só desconta materiais com
--    "controlar estoque" ligado e vinculados ao catálogo; material avulso (texto livre) não baixa.
--  * Uma vez só: `orders.stock_consumed_at` marca que o pedido já baixou o estoque.
--  * Devolução automática: voltar de produção/pronto/entregue para Orçamento ou Confirmado.
--  * Cancelar um pedido que já baixou o estoque: a tela PERGUNTA (p_return_stock); sem resposta
--    positiva, os insumos continuam descontados (podem ter sido usados de verdade).
--  * Reabrir um pedido cancelado NÃO devolve nada (os insumos já tinham saído) e mantém a marca,
--    então quando voltar à produção não desconta duas vezes.
--  * Estoque negativo é permitido: a função só AVISA quais materiais ficaram negativos.
--  * Cada baixa guarda o custo do material no dia (base do custo e da margem reais do pedido).

alter table orders add column if not exists stock_consumed_at timestamptz;

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
    with consumed as (
      insert into stock_movements (store_id, material_id, kind, quantity, unit_cost, order_id, note)
      select
        v_order.store_id,
        pm.material_id,
        'consumption',
        -sum(pm.quantity * oi.quantity),
        m.unit_cost,
        v_order.id,
        'Pedido em produção'
      from order_items oi
      join product_materials pm on pm.product_id = oi.product_id
      join materials m on m.id = pm.material_id and m.store_id = v_order.store_id
      where oi.order_id = v_order.id
        and oi.product_id is not null
        and pm.material_id is not null
        and m.track_stock
      group by pm.material_id, m.unit_cost
      having sum(pm.quantity * oi.quantity) > 0
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
