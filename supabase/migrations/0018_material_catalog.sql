-- Catálogo de materiais reutilizáveis (pedido do usuário).
--
-- Antes, cada peça digitava o material do zero (nome + custo), e o mesmo fio
-- ou fecho tinha o preço redigitado peça a peça — sujeito a erro de digitação
-- e sem refletir reajuste de fornecedor nas peças já cadastradas.
--
-- Aqui `product_materials` passa a poder referenciar um material do catálogo:
-- quando `material_id` está preenchido, o custo unitário exibido é sempre o
-- do catálogo (join na leitura, não snapshot) — reajustar o preço do fio uma
-- vez atualiza a formação de preço de toda peça que o usa. `material_id` nulo
-- preserva o comportamento atual (linha avulsa, digitada à mão), para o
-- insumo usado uma única vez que não vale a pena catalogar.

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  unit text not null default 'un',
  unit_cost numeric(10,2) not null default 0 check (unit_cost >= 0),
  status text not null default 'active' check (status in ('active','archived')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_materials_store on materials(store_id) where status = 'active';

create trigger trg_materials_updated_at before update on materials
  for each row execute function set_updated_at();

alter table materials enable row level security;

create policy "materials_owner_all" on materials for all
  using (exists (
    select 1 from stores s
    where s.id = materials.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from stores s
    where s.id = materials.store_id and s.owner_user_id = (select auth.uid())));

-- Vínculo opcional ao catálogo. `set null` em vez de bloquear a exclusão: um
-- material do catálogo pode ser removido mesmo já usado em peças — a linha na
-- peça vira avulsa (mantém description/unit_cost que já tinha).
alter table product_materials add column if not exists material_id uuid
  references materials(id) on delete set null;

create index if not exists idx_product_materials_material on product_materials(material_id);
