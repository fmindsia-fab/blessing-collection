-- Paleta da marca com até 5 cores (Milestone 7 — pedido do usuário).
-- Antes eram 3 colunas fixas (primária/secundária/destaque). Vira um array
-- de até 5 cores hex, com as 3 primeiras mantendo o papel semântico:
--   [1] primária  [2] secundária  [3] destaque  [4] e [5] apoio (opcionais)
--
-- Array em vez de 5 colunas: a proprietária pode usar 3, 4 ou 5 cores sem que
-- as não usadas fiquem gravadas com valor falso.

alter table stores add column if not exists brand_colors text[] not null default
  array['#1C1917', '#FAF8F5', '#C9A227'];

-- Migra os valores já existentes para o array, preservando a ordem semântica.
update stores
set brand_colors = array[color_primary, color_secondary, color_accent]
where brand_colors = array['#1C1917', '#FAF8F5', '#C9A227'];

-- Valida a paleta inteira: 1 a 5 cores, todas em hex de 6 dígitos.
-- Função imutável porque CHECK não aceita subquery.
create or replace function is_valid_brand_palette(colors text[])
returns boolean
language sql
immutable
as $$
  select colors is not null
    and array_length(colors, 1) between 1 and 5
    and not exists (
      select 1 from unnest(colors) as c where c !~ '^#[0-9A-Fa-f]{6}$'
    );
$$;

alter table stores drop constraint if exists stores_brand_colors_check;
alter table stores add constraint stores_brand_colors_check
  check (is_valid_brand_palette(brand_colors));

-- color_primary/secondary/accent permanecem para compatibilidade e como
-- fallback de leitura; brand_colors passa a ser a fonte de verdade.
comment on column stores.brand_colors is
  'Paleta da marca, 1 a 5 cores hex. [1] primária, [2] secundária, [3] destaque.';
