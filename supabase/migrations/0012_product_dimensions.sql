-- Peso e dimensões da peça (pedido do usuário).
--
-- O campo `measurements` existente é texto livre ("30cm x 22cm x 10cm"), bom
-- para exibir mas impossível de usar em cálculo. Estas colunas são numéricas
-- e separadas, permitindo no futuro estimar frete sem reparsear string.
--
-- Todas opcionais: peças antigas continuam válidas, e a proprietária preenche
-- só o que souber.

alter table products add column if not exists weight_kg numeric(6,3);
alter table products add column if not exists length_cm numeric(6,2);
alter table products add column if not exists width_cm numeric(6,2);
alter table products add column if not exists height_cm numeric(6,2);

-- Valores negativos ou zero não descrevem uma peça física; nulo segue válido
-- para "não informado".
alter table products drop constraint if exists products_dimensions_positive;
alter table products add constraint products_dimensions_positive check (
  (weight_kg is null or weight_kg > 0)
  and (length_cm is null or length_cm > 0)
  and (width_cm is null or width_cm > 0)
  and (height_cm is null or height_cm > 0)
);

comment on column products.weight_kg is 'Peso em kg. Nulo = não informado.';
comment on column products.length_cm is 'Comprimento em cm.';
comment on column products.width_cm is 'Largura em cm.';
comment on column products.height_cm is 'Altura em cm.';
