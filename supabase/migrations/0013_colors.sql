-- Cores como cadastro próprio, com amostra visual (pedido do usuário).
--
-- Hoje `product_variants.color` é texto livre digitado a cada variante. Nas 18
-- variantes cadastradas isso já produziu: 'Rose' e 'Rosé' como cores distintas,
-- '´Topázio' com acento solto no início e 'Bronze.' com ponto final. Cada erro
-- de digitação vira uma opção separada no filtro público.
--
-- Cores passam a ser registro por loja, com hex — o filtro do catálogo mostra
-- a amostra em vez do nome, que é o padrão em catálogo de moda e resolve o
-- problema de "Pérola - Branco" não dizer nada a quem lê.
--
-- A coluna `color` (texto) permanece: guarda o que já foi digitado e serve de
-- fallback para variante sem cor vinculada. Nada é perdido.

create table if not exists colors (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  slug text not null,
  -- #rgb ou #rrggbb. Cores compostas ("Lilás - Branco") usam hex_secondary
  -- para a amostra dividida ao meio.
  hex text not null check (hex ~* '^#[0-9a-f]{3}([0-9a-f]{3})?$'),
  hex_secondary text check (hex_secondary ~* '^#[0-9a-f]{3}([0-9a-f]{3})?$'),
  status text not null default 'active' check (status in ('active','archived')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, slug)
);

create index if not exists idx_colors_store on colors(store_id) where status = 'active';

create trigger trg_colors_updated_at before update on colors
  for each row execute function set_updated_at();

-- on delete set null, igual a category_id/collection_id/model_id: arquivar uma
-- cor não pode apagar a variante.
alter table product_variants add column if not exists color_id uuid references colors(id) on delete set null;
create index if not exists idx_variants_color on product_variants(color_id);

-- ========== RLS ==========
alter table colors enable row level security;

create policy "colors_public_read_active" on colors for select
  using (
    status = 'active'
    and exists (select 1 from stores s where s.id = colors.store_id and s.status = 'active')
  );

create policy "colors_owner_all" on colors for all
  using (exists (
    select 1 from stores s
    where s.id = colors.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from stores s
    where s.id = colors.store_id and s.owner_user_id = (select auth.uid())));

-- ========== BACKFILL ==========
-- Cria as cores a partir do que já está digitado, normalizando o texto:
-- remove acento agudo solto no início, pontuação final e espaços duplicados.
-- 'Rose' e 'Rosé' colapsam numa cor só porque o slug é gerado sem acento.
--
-- Os hex são um ponto de partida aproximado — a proprietária ajusta no painel,
-- onde vê a amostra ao lado do nome. Sem valor inicial a amostra sairia preta
-- em todas, o que é pior do que uma aproximação.
with normalizado as (
  select distinct
    p.store_id,
    trim(both ' .´`' from regexp_replace(v.color, '\s+', ' ', 'g')) as nome
  from product_variants v
  join products p on p.id = v.product_id
  where v.color is not null
    and trim(both ' .´`' from v.color) <> ''
),
com_slug as (
  select
    store_id,
    -- Primeira grafia encontrada vence quando duas variantes geram o mesmo slug.
    min(nome) as name,
    lower(regexp_replace(
      translate(nome, 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
                       'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'),
      '[^a-zA-Z0-9]+', '-', 'g'
    )) as slug
  from normalizado
  group by store_id, lower(regexp_replace(
    translate(nome, 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
                    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'),
    '[^a-zA-Z0-9]+', '-', 'g'
  ))
)
insert into colors (store_id, name, slug, hex)
select
  store_id,
  name,
  trim(both '-' from slug),
  case trim(both '-' from slug)
    when 'marsala'               then '#8B2942'
    when 'rose'                  then '#D8A0A6'
    when 'nude'                  then '#D9BFA9'
    when 'areia'                 then '#D6C6B0'
    when 'black-piano'           then '#0F0F10'
    when 'perola-branco'         then '#F0EAE0'
    when 'lilas-branco'          then '#C3B3D6'
    when 'bronze'                then '#9C6B3F'
    when 'topazio'               then '#C08A3E'
    when 'ferrugem-perola'       then '#A65A3A'
    when 'azul-marinho-perola'   then '#20324F'
    when 'preto'                 then '#111111'
    else '#B8A99A'
  end
from com_slug
where trim(both '-' from slug) <> ''
on conflict (store_id, slug) do nothing;

-- Segunda cor das compostas, para a amostra dividida.
update colors set hex_secondary = '#F0EAE0'
where hex_secondary is null
  and slug in ('perola-branco', 'lilas-branco', 'ferrugem-perola', 'azul-marinho-perola');

-- Vincula cada variante à cor correspondente, pelo mesmo slug normalizado.
update product_variants v
set color_id = c.id
from products p, colors c
where p.id = v.product_id
  and c.store_id = p.store_id
  and v.color_id is null
  and v.color is not null
  and c.slug = trim(both '-' from lower(regexp_replace(
        translate(trim(both ' .´`' from v.color),
                  'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
                  'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'),
        '[^a-zA-Z0-9]+', '-', 'g')));

-- Ordena por nome; a proprietária reordena no painel se quiser.
update colors c set sort_order = s.rn - 1
from (select id, row_number() over (partition by store_id order by name) as rn from colors) s
where s.id = c.id and c.sort_order = 0;
