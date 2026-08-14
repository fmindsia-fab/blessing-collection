-- Corrige o backfill dos grupos (migration 0016).
--
-- O critério anterior olhava `color_id`, mas nem toda variação de cor tem cor
-- cadastrada vinculada — o resultado foi "Verde Militar" em Opções enquanto
-- "Marsala" caía em Cor na mesma peça, e "Marrom" competindo com "Alça
-- Corrente" na Clutch Bellagio.
--
-- Novo critério: variação sem preço próprio é cor. Não é infalível, mas acerta
-- o padrão desta loja, onde o que difere de preço é sempre acessório (alça,
-- bordado) e as cores usam o preço base. A proprietária ajusta no painel, que
-- agora permite editar.

update product_variants v
set variant_group = 'Cor'
where v.variant_group = 'Opções'
  and v.price is null
  -- Só quando a peça já tem outra variação em "Cor": evita renomear o grupo de
  -- peças cujas variações são todas de outro eixo.
  and exists (
    select 1 from product_variants sibling
    where sibling.product_id = v.product_id
      and sibling.variant_group = 'Cor'
      and sibling.status <> 'archived'
  );

-- Variação com preço próprio numa peça sem outro grupo definido é acessório,
-- não cor: é o caso da alça de corrente.
update product_variants v
set variant_group = 'Opcionais'
where v.variant_group = 'Opções'
  and v.price is not null;

-- Peça cujas variações sem preço ficaram sozinhas em "Opções" (nenhuma irmã em
-- "Cor") vira Cor: numa loja de bolsas, variação sem preço é cor.
update product_variants v
set variant_group = 'Cor'
where v.variant_group = 'Opções'
  and v.price is null;
