-- Catálogo de grupos de variação (pedido do usuário) — reutilizável entre
-- peças, no mesmo padrão de Cores e Materiais.
--
-- `product_variants.variant_group` (migration 0016) continua texto livre: uma
-- peça pode ter um eixo próprio que a proprietária nunca usou antes, e um
-- enum obrigaria migration a cada novidade. Esta tabela só alimenta as
-- sugestões — nome só, sem vínculo direto com variant_group, que segue sendo
-- preenchido por texto (com datalist puxando daqui).

create table if not exists variant_groups (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  status text not null default 'active' check (status in ('active','archived')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, name)
);

create index if not exists idx_variant_groups_store on variant_groups(store_id) where status = 'active';

create trigger trg_variant_groups_updated_at before update on variant_groups
  for each row execute function set_updated_at();

alter table variant_groups enable row level security;

create policy "variant_groups_owner_all" on variant_groups for all
  using (exists (
    select 1 from stores s
    where s.id = variant_groups.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from stores s
    where s.id = variant_groups.store_id and s.owner_user_id = (select auth.uid())));

-- Backfill: os grupos já usados nas peças (Cor, Alça, Opções...) viram itens
-- do catálogo, pra não começar vazio e a proprietária ter que redigitar tudo.
insert into variant_groups (store_id, name, sort_order)
select
  p.store_id,
  v.variant_group,
  row_number() over (partition by p.store_id order by min(v.created_at)) - 1
from product_variants v
join products p on p.id = v.product_id
where v.variant_group is not null and trim(v.variant_group) <> ''
group by p.store_id, v.variant_group
on conflict (store_id, name) do nothing;
