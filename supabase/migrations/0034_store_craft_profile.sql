-- Perfil do ateliê para o futuro marketplace de divulgação: cidade, UF e tipo
-- de artesanato. São dados PÚBLICOS da loja (a policy stores_public_read_active
-- já expõe a linha das lojas ativas); CPF/CNPJ continua só em profiles.
--
-- A lista de tipos de artesanato cresce sem migration (validada na
-- aplicação, como as fontes na 0010) — aqui só limitamos tamanhos.
-- Colunas nullable: lojas já existentes não têm esses dados.
-- Idempotente.

alter table stores add column if not exists city text;
alter table stores add column if not exists state text;
alter table stores add column if not exists craft_types text[] not null default '{}';
alter table stores add column if not exists craft_other text;

alter table stores drop constraint if exists stores_state_format;
alter table stores
  add constraint stores_state_format check (state is null or state ~ '^[A-Z]{2}$');

alter table stores drop constraint if exists stores_craft_types_size;
alter table stores
  add constraint stores_craft_types_size check (cardinality(craft_types) <= 8);

alter table stores drop constraint if exists stores_city_craft_other_length;
alter table stores
  add constraint stores_city_craft_other_length
  check (char_length(coalesce(city, '')) <= 80 and char_length(coalesce(craft_other, '')) <= 60);
