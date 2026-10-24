-- Contas a pagar e fluxo de caixa (M20 do plano de estoque/financeiro).
--
--  * payables: contas a pagar (insumos, embalagem, frete, taxas, divulgação, outras). Pode repetir
--    todo mês e pode vir de uma compra (à vista = já paga; a prazo/parcelada = uma conta por parcela).
--  * cash_incomes: outras entradas avulsas do caixa (além dos sinais/saldos dos pedidos).
--  * store_private: saldo inicial do caixa e a data a partir da qual ele vale.
--  * create_purchase ganha a forma de pagamento e gera as contas na mesma transação.
--  * cancel_purchase também cancela as contas da compra.
--  * pay_payable dá baixa numa conta e, se ela repete todo mês, cria a do mês seguinte.
--
-- Segurança: RLS "só a dona" (mesmo padrão de compras e pedidos), sem leitura pública. Nenhuma
-- linha é apagada: "excluir" vira status = 'cancelled'. Funções SECURITY INVOKER (a RLS do usuário
-- continua valendo). Idempotente.

-- ========== SALDO INICIAL DO CAIXA ==========
alter table store_private add column if not exists cash_opening_balance numeric(12,2) not null default 0;
alter table store_private add column if not exists cash_opening_date date;

-- ========== CONTAS A PAGAR ==========
create table if not exists payables (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  description text not null check (char_length(btrim(description)) between 1 and 120),
  category text not null default 'other'
    check (category in ('supplies', 'packaging', 'shipping', 'fees', 'marketing', 'other')),
  supplier text check (supplier is null or char_length(supplier) <= 80),
  due_date date not null,
  amount numeric(10,2) not null check (amount > 0),
  paid_at date,
  recurrence text not null default 'none' check (recurrence in ('none', 'monthly')),
  -- Evita criar duas vezes a conta do mês seguinte se a baixa for desfeita e refeita.
  next_generated boolean not null default false,
  purchase_id uuid references purchases(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payables_store_due on payables(store_id, due_date);
create index if not exists idx_payables_store_paid on payables(store_id, paid_at) where paid_at is not null;
create index if not exists idx_payables_purchase on payables(purchase_id) where purchase_id is not null;

drop trigger if exists trg_payables_updated_at on payables;
create trigger trg_payables_updated_at before update on payables
  for each row execute function set_updated_at();

alter table payables enable row level security;

drop policy if exists "payables_owner_all" on payables;
create policy "payables_owner_all" on payables for all
  using (exists (
    select 1 from stores s
    where s.id = payables.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from stores s
    where s.id = payables.store_id and s.owner_user_id = (select auth.uid())));

-- ========== OUTRAS ENTRADAS DO CAIXA ==========
create table if not exists cash_incomes (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  description text not null check (char_length(btrim(description)) between 1 and 120),
  amount numeric(10,2) not null check (amount > 0),
  received_at date not null,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cash_incomes_store_date on cash_incomes(store_id, received_at desc);

drop trigger if exists trg_cash_incomes_updated_at on cash_incomes;
create trigger trg_cash_incomes_updated_at before update on cash_incomes
  for each row execute function set_updated_at();

alter table cash_incomes enable row level security;

drop policy if exists "cash_incomes_owner_all" on cash_incomes;
create policy "cash_incomes_owner_all" on cash_incomes for all
  using (exists (
    select 1 from stores s
    where s.id = cash_incomes.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from stores s
    where s.id = cash_incomes.store_id and s.owner_user_id = (select auth.uid())));

-- ========== COMPRA: forma de pagamento gera as contas ==========
-- A assinatura muda (3 parâmetros novos), então a antiga sai para não ficar duas versões.
drop function if exists create_purchase(uuid, date, text, numeric, text, jsonb);

-- p_payment_mode: 'paid' = pago na hora (uma conta já paga na data da compra);
--                 'later' = a prazo: p_installments parcelas mensais a partir de p_first_due.
create or replace function create_purchase(
  p_store_id uuid,
  p_purchased_at date,
  p_supplier text,
  p_freight numeric,
  p_notes text,
  p_items jsonb,
  p_payment_mode text default 'paid',
  p_first_due date default null,
  p_installments int default 1
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
  v_date date := coalesce(p_purchased_at, current_date);
  v_supplier text := nullif(btrim(p_supplier), '');
  v_label text;
  v_base numeric;
  v_amount numeric;
  i int;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Informe ao menos um item na compra.';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Muitos itens numa só compra (máximo 50).';
  end if;
  if p_payment_mode is null or p_payment_mode not in ('paid', 'later') then
    raise exception 'Forma de pagamento inválida.';
  end if;
  if p_payment_mode = 'later' then
    if p_first_due is null then
      raise exception 'Informe quando vence a primeira parcela.';
    end if;
    if p_installments is null or p_installments < 1 or p_installments > 24 then
      raise exception 'O número de parcelas deve ser de 1 a 24.';
    end if;
  end if;

  insert into purchases (store_id, purchased_at, supplier, freight, notes)
  values (
    p_store_id,
    v_date,
    v_supplier,
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

  v_total := v_total + coalesce(p_freight, 0);
  update purchases set total_amount = v_total where id = v_purchase_id;

  -- Contas da compra (compra de valor zero não gera conta).
  if v_total > 0 then
    v_label := 'Compra' || coalesce(' - ' || v_supplier, ' de materiais');

    if p_payment_mode = 'paid' then
      insert into payables (store_id, description, category, supplier, due_date, amount, paid_at, purchase_id)
      values (p_store_id, left(v_label, 120), 'supplies', v_supplier, v_date, v_total, v_date, v_purchase_id);
    else
      v_base := round(v_total / p_installments, 2);
      for i in 1..p_installments loop
        -- A última parcela leva a diferença do arredondamento: a soma sempre fecha no total.
        v_amount := case when i = p_installments then v_total - v_base * (p_installments - 1) else v_base end;
        insert into payables (store_id, description, category, supplier, due_date, amount, purchase_id)
        values (
          p_store_id,
          left(v_label || case when p_installments > 1 then format(' (%s/%s)', i, p_installments) else '' end, 120),
          'supplies',
          v_supplier,
          (p_first_due + make_interval(months => i - 1))::date,
          v_amount,
          v_purchase_id
        );
      end loop;
    end if;
  end if;

  return v_purchase_id;
end;
$$;

revoke all on function create_purchase(uuid, date, text, numeric, text, jsonb, text, date, int) from public, anon;
grant execute on function create_purchase(uuid, date, text, numeric, text, jsonb, text, date, int) to authenticated;

-- Cancelar a compra também cancela as contas dela (pagas ou não): o lançamento foi um engano.
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

  update payables set status = 'cancelled'
  where purchase_id = p_purchase_id and store_id = v_purchase.store_id and status = 'active';

  update purchases set status = 'cancelled', cancelled_at = now() where id = p_purchase_id;
end;
$$;

revoke all on function cancel_purchase(uuid) from public, anon;
grant execute on function cancel_purchase(uuid) to authenticated;

-- ========== BAIXA DE UMA CONTA ==========
-- Marca como paga na data informada. Se a conta repete todo mês e a do mês seguinte ainda não foi
-- criada, cria (mesmo valor, vencimento um mês depois).
create or replace function pay_payable(p_store_id uuid, p_payable_id uuid, p_paid_at date)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_payable payables%rowtype;
begin
  select * into v_payable from payables
  where id = p_payable_id and store_id = p_store_id
  for update;
  if not found then
    raise exception 'Conta não encontrada.';
  end if;
  if v_payable.status = 'cancelled' then
    raise exception 'Esta conta foi cancelada.';
  end if;
  if v_payable.paid_at is not null then
    return;
  end if;

  update payables set paid_at = coalesce(p_paid_at, current_date) where id = v_payable.id;

  if v_payable.recurrence = 'monthly' and not v_payable.next_generated then
    insert into payables (store_id, description, category, supplier, due_date, amount, recurrence)
    values (
      v_payable.store_id,
      v_payable.description,
      v_payable.category,
      v_payable.supplier,
      (v_payable.due_date + make_interval(months => 1))::date,
      v_payable.amount,
      'monthly'
    );
    update payables set next_generated = true where id = v_payable.id;
  end if;
end;
$$;

revoke all on function pay_payable(uuid, uuid, date) from public, anon;
grant execute on function pay_payable(uuid, uuid, date) to authenticated;
