-- Grupos de variação (pedido do usuário: escolher cor E alça na mesma peça).
--
-- Hoje as variações são uma lista única, então escolher "Marrom" desmarca
-- "Alça Corrente" — mas a cliente quer as duas. O grupo diz o que é
-- alternativa entre si: uma escolha por grupo, várias no total.
--
-- Texto livre em vez de enum: cada peça pode ter eixos próprios (cor, alça,
-- forro, bordado), e um enum exigiria migration a cada novidade.
alter table product_variants add column if not exists variant_group text;

-- Backfill: variação com cor vinculada é do grupo "Cor"; o resto vira
-- "Opções". A proprietária ajusta no painel — o palpite só evita que tudo
-- comece sem grupo, o que manteria o comportamento antigo.
update product_variants
set variant_group = case when color_id is not null then 'Cor' else 'Opções' end
where variant_group is null;

-- Índice para a ordenação por grupo na página da peça.
create index if not exists idx_variants_group on product_variants(product_id, variant_group, sort_order);
