-- Dados PRIVADOS da loja (Pix e precificação), fora da tabela `stores`.
--
-- Problema (auditoria de 2026-10-17): `stores` tem uma policy de leitura
-- pública (stores_public_read_active) que expõe a LINHA inteira de toda loja
-- ativa. Como o RLS não filtra colunas, qualquer visitante (e qualquer usuário
-- logado, de qualquer loja) conseguia ler pix_key, monthly_pay,
-- monthly_fixed_cost, regime/alíquota de imposto e margem de TODAS as lojas —
-- embora 0014_pricing.sql afirme que "a precificação é interna".
--
-- Correção: estes campos passam para `store_private`, com RLS só para a dona
-- (e leitura do admin da plataforma, que já enxerga tudo da operação).
--
-- ETAPA 1 (esta migration): cria a tabela, copia os dados e protege. As
-- colunas antigas de `stores` CONTINUAM existindo (e expostas) até a etapa 2
-- (0038), aplicada só depois que o código novo estiver no ar lendo daqui.
--
-- Idempotente.

create table if not exists store_private (
  store_id uuid primary key references stores(id) on delete cascade,
  pix_key text,
  monthly_pay numeric(10,2) not null default 0,
  monthly_fixed_cost numeric(10,2) not null default 0,
  productive_hours_per_month numeric(6,2) not null default 0,
  tax_regime text not null default 'none'
    check (tax_regime in ('none','mei','simples','other')),
  tax_percent numeric(5,2) not null default 0
    check (tax_percent >= 0 and tax_percent < 100),
  default_pricing_method text not null default 'margin'
    check (default_pricing_method in ('margin','markup')),
  default_margin_percent numeric(5,2) not null default 50
    check (default_margin_percent >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_store_private_updated_at on store_private;
create trigger trg_store_private_updated_at before update on store_private
  for each row execute function set_updated_at();

alter table store_private enable row level security;

-- Dona da loja: acesso total aos próprios dados. Sem policy para anon: visitante
-- não lê nada. (select auth.uid()) evita reavaliar a função por linha (ver 0008).
drop policy if exists "store_private_owner_all" on store_private;
create policy "store_private_owner_all" on store_private for all
  using (exists (
    select 1 from stores s
    where s.id = store_private.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from stores s
    where s.id = store_private.store_id and s.owner_user_id = (select auth.uid())));

-- Admin da plataforma só lê (suporte); escrita continua sendo da dona.
drop policy if exists "store_private_platform_admin_read" on store_private;
create policy "store_private_platform_admin_read" on store_private for select
  using (is_platform_admin());

-- Copia o que já existe nas colunas antigas. `on conflict do nothing` mantém a
-- migration segura para rodar de novo sem sobrescrever edições feitas depois.
insert into store_private (
  store_id, pix_key, monthly_pay, monthly_fixed_cost, productive_hours_per_month,
  tax_regime, tax_percent, default_pricing_method, default_margin_percent
)
select
  id, pix_key, monthly_pay, monthly_fixed_cost, productive_hours_per_month,
  tax_regime, tax_percent, default_pricing_method, default_margin_percent
from stores
on conflict (store_id) do nothing;
