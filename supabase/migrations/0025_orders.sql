-- Controle de pedidos/encomendas (pedido do usuário).
--
-- Extensão de escopo aprovada sobre o PRD (seção 5.2 excluía "controle
-- financeiro" e "controle avançado de estoque" do MVP): este é um controle de
-- ENCOMENDAS sob medida — cliente, itens, prazo e pagamento (sinal/saldo) de
-- pedidos que já foram fechados via WhatsApp, não um financeiro completo
-- (sem contas a pagar, fluxo de caixa ou fechamento contábil) nem controle de
-- estoque (sem baixa automática de insumo). Documentado como Milestone 12 no
-- PLAN.md.
--
-- Mesmo padrão de dado sensível de negócio das tabelas de precificação
-- (migration 0014): RLS só para a dona, sem policy pública de leitura.

-- ========== CLIENTES ==========
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  phone text,
  notes text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_customers_store on customers(store_id) where status = 'active';

create trigger trg_customers_updated_at before update on customers
  for each row execute function set_updated_at();

alter table customers enable row level security;

create policy "customers_owner_all" on customers for all
  using (exists (
    select 1 from stores s
    where s.id = customers.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from stores s
    where s.id = customers.store_id and s.owner_user_id = (select auth.uid())));

-- ========== PEDIDOS ==========
-- Fluxo completo (decisão do usuário): orçamento/negociação até entregue,
-- cobrindo a encomenda sob medida do primeiro contato à entrega.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete restrict,
  status text not null default 'quote'
    check (status in ('quote', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled')),

  order_date date not null default current_date,
  expected_delivery_date date,
  delivered_at timestamptz,

  -- Sinal + saldo (decisão do usuário): reflete a prática comum de encomenda
  -- sob medida, em vez de um único valor/data de pagamento.
  deposit_amount numeric(10,2) not null default 0 check (deposit_amount >= 0),
  deposit_paid_at date,
  deposit_payment_method_id uuid references payment_methods(id) on delete set null,
  balance_amount numeric(10,2) not null default 0 check (balance_amount >= 0),
  balance_paid_at date,
  balance_payment_method_id uuid references payment_methods(id) on delete set null,

  -- Persistido (não derivado só na leitura) para não recalcular somando todos
  -- os itens toda vez que a lista de pedidos é exibida; mantido em sincronia
  -- pelas Server Actions que escrevem itens.
  total_amount numeric(10,2) not null default 0 check (total_amount >= 0),

  notes text,
  -- Campo livre pedido pelo usuário, além da lista derivada dos materiais
  -- cadastrados em cada peça (via product_materials) — para insumo extra que
  -- não está no cadastro do produto.
  production_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_store_status on orders(store_id, status);
create index idx_orders_store_delivery on orders(store_id, expected_delivery_date)
  where status not in ('delivered', 'cancelled');
create index idx_orders_customer on orders(customer_id);

create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();

alter table orders enable row level security;

create policy "orders_owner_all" on orders for all
  using (exists (
    select 1 from stores s
    where s.id = orders.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from stores s
    where s.id = orders.store_id and s.owner_user_id = (select auth.uid())));

-- ========== ITENS DO PEDIDO ==========
-- Item do catálogo (product_id preenchido) ou avulso/personalizado
-- (custom_name preenchido) — decisão do usuário: encomenda sob medida
-- frequentemente foge do que já está cadastrado como produto.
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,

  custom_name text,
  custom_description text,

  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null default 0 check (unit_price >= 0),
  sort_order int not null default 0,

  created_at timestamptz not null default now(),

  constraint order_items_product_or_custom check (
    product_id is not null or custom_name is not null
  )
);

create index idx_order_items_order on order_items(order_id);
create index idx_order_items_product on order_items(product_id) where product_id is not null;

alter table order_items enable row level security;

create policy "order_items_owner_all" on order_items for all
  using (exists (
    select 1 from orders o
    join stores s on s.id = o.store_id
    where o.id = order_items.order_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from orders o
    join stores s on s.id = o.store_id
    where o.id = order_items.order_id and s.owner_user_id = (select auth.uid())));
