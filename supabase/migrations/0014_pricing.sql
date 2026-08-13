-- Formação de preço de venda (pedido do usuário).
--
-- A precificação é interna: nada aqui aparece no catálogo público. O preço de
-- etiqueta continua sendo `products.price`, preenchido pela proprietária a
-- partir da sugestão que esta ficha calcula.
--
-- Método padrão: margem sobre o preço de venda, `custo / (1 - margem - taxas)`.
-- Markup sobre custo fica disponível como alternativa. As fórmulas vivem em
-- lib/pricing/calculate.ts — aqui só os dados de entrada.

-- ========== CONFIGURAÇÃO DA LOJA ==========
-- Valores mensais, não por hora: a proprietária sabe quanto quer ganhar no mês
-- e quanto gasta de aluguel/energia; o valor/hora é derivado disso.
alter table stores add column if not exists monthly_pay numeric(10,2) not null default 0;
alter table stores add column if not exists monthly_fixed_cost numeric(10,2) not null default 0;

-- Horas PRODUTIVAS, não horas trabalhadas: responder cliente, fotografar e ir
-- ao correio consome tempo que não vira peça, mas precisa ser pago pelas horas
-- que viram. Dividir pelo total infla a base e barateia a peça.
alter table stores add column if not exists productive_hours_per_month numeric(6,2) not null default 0;

-- 'none' | 'mei' | 'simples' | 'other'.
--
-- MEI não entra aqui como percentual: o DAS é valor fixo mensal e deve ser
-- somado a `monthly_fixed_cost`, senão a peça é taxada duas vezes. Só Simples
-- e "outro" incidem sobre a venda.
alter table stores add column if not exists tax_regime text not null default 'none'
  check (tax_regime in ('none','mei','simples','other'));
alter table stores add column if not exists tax_percent numeric(5,2) not null default 0
  check (tax_percent >= 0 and tax_percent < 100);

-- Método e margem padrão, herdados por peça nova.
alter table stores add column if not exists default_pricing_method text not null default 'margin'
  check (default_pricing_method in ('margin','markup'));
alter table stores add column if not exists default_margin_percent numeric(5,2) not null default 50
  check (default_margin_percent >= 0);

-- ========== FORMAS DE PAGAMENTO ==========
-- Cadastradas pela proprietária: as taxas variam por adquirente e por
-- negociação, então nada de valores fixos no código.
create table if not exists payment_methods (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  label text not null,
  fee_percent numeric(5,2) not null default 0 check (fee_percent >= 0 and fee_percent < 100),
  installments int not null default 1 check (installments >= 1 and installments <= 12),
  status text not null default 'active' check (status in ('active','archived')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payment_methods_store on payment_methods(store_id) where status = 'active';

create trigger trg_payment_methods_updated_at before update on payment_methods
  for each row execute function set_updated_at();

-- ========== CUSTOS DA PEÇA ==========
alter table products add column if not exists production_hours numeric(6,2) not null default 0
  check (production_hours >= 0);
alter table products add column if not exists other_costs numeric(10,2) not null default 0
  check (other_costs >= 0);

-- Método e percentual podem divergir do padrão da loja: uma peça de vitrine
-- pode sair com margem menor que uma exclusiva.
alter table products add column if not exists pricing_method text
  check (pricing_method is null or pricing_method in ('margin','markup'));
alter table products add column if not exists pricing_rate_percent numeric(5,2)
  check (pricing_rate_percent is null or pricing_rate_percent >= 0);

-- ========== MATERIAIS DA PEÇA ==========
-- Linhas livres em vez de colunas fixas (fio, alça, fecho…): cada peça usa um
-- conjunto diferente, e colunas fixas exigiriam migration a cada material novo.
create table if not exists product_materials (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  description text not null,
  quantity numeric(10,3) not null default 1 check (quantity >= 0),
  unit text not null default 'un',
  unit_cost numeric(10,2) not null default 0 check (unit_cost >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_materials_product on product_materials(product_id);

create trigger trg_product_materials_updated_at before update on product_materials
  for each row execute function set_updated_at();

-- ========== RLS ==========
-- Dado de custo é informação sensível do negócio: ao contrário das outras
-- tabelas do catálogo, NÃO existe policy de leitura pública aqui. Só a dona.
alter table payment_methods enable row level security;
alter table product_materials enable row level security;

create policy "payment_methods_owner_all" on payment_methods for all
  using (exists (
    select 1 from stores s
    where s.id = payment_methods.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from stores s
    where s.id = payment_methods.store_id and s.owner_user_id = (select auth.uid())));

create policy "product_materials_owner_all" on product_materials for all
  using (exists (
    select 1 from products p
    join stores s on s.id = p.store_id
    where p.id = product_materials.product_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from products p
    join stores s on s.id = p.store_id
    where p.id = product_materials.product_id and s.owner_user_id = (select auth.uid())));

-- ========== FORMAS DE PAGAMENTO INICIAIS ==========
-- Taxas em zero de propósito: a proprietária preenche com as taxas que ela
-- realmente paga. Valor sugerido daria falsa precisão ao cálculo.
insert into payment_methods (store_id, label, fee_percent, installments, sort_order)
select s.id, v.label, 0, v.installments, v.sort_order
from stores s
cross join (values
  ('Pix', 1, 0),
  ('Dinheiro', 1, 1),
  ('Débito', 1, 2),
  ('Crédito 1x', 1, 3),
  ('Crédito 2x', 2, 4),
  ('Crédito 3x', 3, 5),
  ('Crédito 6x', 6, 6),
  ('Crédito 12x', 12, 7)
) as v(label, installments, sort_order)
where not exists (select 1 from payment_methods pm where pm.store_id = s.id);
