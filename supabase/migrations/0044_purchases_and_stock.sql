-- M18: compras de insumos e estoque básico (pedido do usuário, plano em docs/plano-estoque-financeiro-funil.md).
--
-- Extensão de escopo aprovada sobre o PRD (seção 5.2 deixava financeiro e estoque fora do MVP).
-- Só CRIA objetos novos e acrescenta duas colunas opcionais em `materials`: nenhum dado
-- existente é alterado ou apagado.
--
-- Modelo:
--  * `purchases` / `purchase_items`: o histórico de compras (data, fornecedor, itens, valor pago).
--  * `stock_movements`: LIVRO-RAZÃO do estoque. O saldo de um material é a soma dos movimentos.
--    É imutável: o dono pode ler e lançar, mas ninguém altera nem apaga (não há policy de
--    UPDATE/DELETE). Erro se corrige com um lançamento de ajuste, mantendo o histórico.
--  * Funções (SECURITY INVOKER: a RLS do usuário continua valendo): `create_purchase`,
--    `cancel_purchase` e `adjust_stock` fazem tudo numa transação só, para a compra, o saldo
--    e o custo nunca ficarem pela metade.
--
-- Segurança: mesmo padrão de pedidos/materiais (RLS "só a dona", sem leitura pública).

-- ========== MATERIAIS: controle de estoque opcional, material a material ==========
alter table materials add column if not exists track_stock boolean not null default false;
alter table materials add column if not exists min_stock numeric(12,3) check (min_stock is null or min_stock >= 0);

-- ========== COMPRAS ==========
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  purchased_at date not null default current_date,
  supplier text check (supplier is null or char_length(supplier) <= 80),
  freight numeric(10,2) not null default 0 check (freight >= 0),
  -- Persistido (soma dos itens + frete): mantido pela função create_purchase.
  total_amount numeric(10,2) not null default 0 check (total_amount >= 0),
  notes text check (notes is null or char_length(notes) <= 500),
  status text not null default 'active' check (status in ('active', 'cancelled')),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_purchases_store_date on purchases(store_id, purchased_at desc);

create trigger trg_purchases_updated_at before update on purchases
  for each row execute function set_updated_at();

alter table purchases enable row level security;

create policy "purchases_owner_all" on purchases for all
  using (exists (
    select 1 from stores s
    where s.id = purchases.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from stores s
    where s.id = purchases.store_id and s.owner_user_id = (select auth.uid())));

-- ========== ITENS DA COMPRA ==========
create table if not exists purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  material_id uuid not null references materials(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  -- O que foi PAGO por esta linha (não o preço da unidade): é o número que a pessoa tem na nota.
  total_cost numeric(10,2) not null check (total_cost >= 0),
  unit_cost numeric(12,4) generated always as (total_cost / quantity) stored,
  created_at timestamptz not null default now()
);

create index if not exists idx_purchase_items_purchase on purchase_items(purchase_id);
create index if not exists idx_purchase_items_material on purchase_items(material_id);

alter table purchase_items enable row level security;

create policy "purchase_items_owner_all" on purchase_items for all
  using (exists (
    select 1 from purchases p
    join stores s on s.id = p.store_id
    where p.id = purchase_items.purchase_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from purchases p
    join stores s on s.id = p.store_id
    where p.id = purchase_items.purchase_id and s.owner_user_id = (select auth.uid())));

-- ========== MOVIMENTOS DE ESTOQUE (livro-razão imutável) ==========
create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  material_id uuid not null references materials(id) on delete restrict,
  -- compra (+), baixa por pedido (-), devolução (+), ajuste (+/-). 'baixa' e 'devolução' entram na M19.
  kind text not null check (kind in ('purchase', 'consumption', 'return', 'adjustment')),
  quantity numeric(12,3) not null check (quantity <> 0),
  -- Custo da unidade NO MOMENTO do movimento (base do custo real de cada pedido).
  unit_cost numeric(12,4) check (unit_cost is null or unit_cost >= 0),
  purchase_item_id uuid references purchase_items(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  note text check (note is null or char_length(note) <= 300),
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_movements_material on stock_movements(store_id, material_id, created_at desc);
create index if not exists idx_stock_movements_order on stock_movements(order_id) where order_id is not null;

alter table stock_movements enable row level security;

-- Só leitura e inclusão. Sem policy de UPDATE/DELETE: o histórico não é alterado por ninguém.
create policy "stock_movements_owner_select" on stock_movements for select
  using (exists (
    select 1 from stores s
    where s.id = stock_movements.store_id and s.owner_user_id = (select auth.uid())));

create policy "stock_movements_owner_insert" on stock_movements for insert
  with check (exists (
    select 1 from stores s
    where s.id = stock_movements.store_id and s.owner_user_id = (select auth.uid())));

-- ========== SALDO POR MATERIAL ==========
-- security_invoker: a RLS das tabelas de baixo continua valendo para quem consulta.
create or replace view material_stock with (security_invoker = true) as
select
  m.store_id,
  m.id as material_id,
  coalesce(sum(sm.quantity), 0)::numeric(14,3) as stock
from materials m
left join stock_movements sm on sm.material_id = m.id
group by m.store_id, m.id;

revoke all on material_stock from anon;

-- ========== FUNÇÕES (transação única, RLS do usuário aplicada) ==========

-- Lança uma compra inteira: cabeçalho, itens e a entrada no estoque. A compra liga o controle de
-- estoque do material. `update_cost` (por item) atualiza o custo do cadastro do material para o
-- preço pago, só quando a pessoa confirma na tela (isso muda a sugestão de preço das peças).
create or replace function create_purchase(
  p_store_id uuid,
  p_purchased_at date,
  p_supplier text,
  p_freight numeric,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_purchase_id uuid;
  v_item jsonb;
  v_item_id uuid;
  v_material uuid;
  v_qty numeric;
  v_cost numeric;
  v_total numeric := 0;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Informe ao menos um item na compra.';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Muitos itens numa só compra (máximo 50).';
  end if;

  insert into purchases (store_id, purchased_at, supplier, freight, notes)
  values (
    p_store_id,
    coalesce(p_purchased_at, current_date),
    nullif(btrim(p_supplier), ''),
    coalesce(p_freight, 0),
    nullif(btrim(p_notes), '')
  )
  returning id into v_purchase_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_material := (v_item->>'material_id')::uuid;
    v_qty := (v_item->>'quantity')::numeric;
    v_cost := (v_item->>'total_cost')::numeric;

    if not exists (select 1 from materials m where m.id = v_material and m.store_id = p_store_id) then
      raise exception 'Material inválido na compra.';
    end if;

    insert into purchase_items (purchase_id, material_id, quantity, total_cost)
    values (v_purchase_id, v_material, v_qty, v_cost)
    returning id into v_item_id;

    insert into stock_movements (store_id, material_id, kind, quantity, unit_cost, purchase_item_id)
    values (p_store_id, v_material, 'purchase', v_qty, v_cost / v_qty, v_item_id);

    update materials set track_stock = true where id = v_material and store_id = p_store_id;

    if coalesce((v_item->>'update_cost')::boolean, false) then
      update materials set unit_cost = round(v_cost / v_qty, 2) where id = v_material and store_id = p_store_id;
    end if;

    v_total := v_total + v_cost;
  end loop;

  update purchases set total_amount = v_total + coalesce(p_freight, 0) where id = v_purchase_id;

  return v_purchase_id;
end;
$$;

-- Cancela uma compra lançada errada: marca como cancelada e tira a entrada do estoque com um
-- lançamento de ajuste (o histórico original fica). Não desfaz mudança de custo do material.
create or replace function cancel_purchase(p_purchase_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_purchase purchases%rowtype;
begin
  select * into v_purchase from purchases where id = p_purchase_id for update;
  if not found then
    raise exception 'Compra não encontrada.';
  end if;
  if v_purchase.status = 'cancelled' then
    return;
  end if;

  insert into stock_movements (store_id, material_id, kind, quantity, unit_cost, purchase_item_id, note)
  select v_purchase.store_id, pi.material_id, 'adjustment', -pi.quantity, pi.unit_cost, pi.id, 'Compra cancelada'
  from purchase_items pi
  where pi.purchase_id = p_purchase_id;

  update purchases set status = 'cancelled', cancelled_at = now() where id = p_purchase_id;
end;
$$;

-- Acerta o saldo de um material para a quantidade contada (estoque inicial, inventário, perda):
-- lança a diferença como ajuste. Também liga o controle de estoque do material.
create or replace function adjust_stock(p_material_id uuid, p_new_quantity numeric, p_note text)
returns numeric
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_store uuid;
  v_unit_cost numeric;
  v_current numeric;
  v_delta numeric;
begin
  if p_new_quantity is null or p_new_quantity < 0 then
    raise exception 'Informe uma quantidade válida (zero ou mais).';
  end if;

  select store_id, unit_cost into v_store, v_unit_cost from materials where id = p_material_id for update;
  if not found then
    raise exception 'Material não encontrado.';
  end if;

  select coalesce(sum(quantity), 0) into v_current from stock_movements where material_id = p_material_id;
  v_delta := p_new_quantity - v_current;

  if v_delta <> 0 then
    insert into stock_movements (store_id, material_id, kind, quantity, unit_cost, note)
    values (v_store, p_material_id, 'adjustment', v_delta, v_unit_cost, nullif(btrim(p_note), ''));
  end if;

  update materials set track_stock = true where id = p_material_id;

  return v_delta;
end;
$$;

revoke all on function create_purchase(uuid, date, text, numeric, text, jsonb) from public, anon;
revoke all on function cancel_purchase(uuid) from public, anon;
revoke all on function adjust_stock(uuid, numeric, text) from public, anon;
grant execute on function create_purchase(uuid, date, text, numeric, text, jsonb) to authenticated;
grant execute on function cancel_purchase(uuid) to authenticated;
grant execute on function adjust_stock(uuid, numeric, text) to authenticated;
