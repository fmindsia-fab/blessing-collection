-- Perfil de divulgação do ateliê para o futuro marketplace.
--
-- marketplace_opt_in: consentimento EXPLÍCITO (LGPD) para a loja ser listada
-- no marketplace. Nasce false; marketplace_opt_in_at registra quando foi dado.
-- Só lojas com opt_in = true podem ser listadas — filtrar sempre por ele.
--
-- accepts_custom_orders / ships_nationwide: null = não informado.
-- years_active: faixa ('lt1' | '1to3' | '3to5' | '5to10' | 'gt10'), validada
-- na aplicação (a lista pode crescer sem migration).
--
-- Dados públicos da loja (a policy stores_public_read_active já expõe a linha
-- das lojas ativas). Idempotente.

alter table stores add column if not exists marketplace_opt_in boolean not null default false;
alter table stores add column if not exists marketplace_opt_in_at timestamptz;
alter table stores add column if not exists accepts_custom_orders boolean;
alter table stores add column if not exists ships_nationwide boolean;
alter table stores add column if not exists years_active text;

alter table stores drop constraint if exists stores_years_active_length;
alter table stores
  add constraint stores_years_active_length
  check (years_active is null or char_length(years_active) <= 10);
