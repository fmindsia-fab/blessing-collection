-- Trial de 30 dias + separação entre STATUS DA LOJA e STATUS DA ASSINATURA.
--
--   stores.status              -> estado operacional/administrativo da loja:
--                                 active | suspended | archived.
--                                 'suspended' é bloqueio MANUAL da plataforma
--                                 (fraude, violação...). Fim de trial e
--                                 inadimplência NUNCA alteram esta coluna —
--                                 loja não-active some do tenant resolver e
--                                 derruba até o /admin do proprietário.
--   store_subscriptions.status -> estado comercial:
--                                 trialing | active | past_due | canceled | expired
--   store_subscriptions.billing_type -> origem da cobrança:
--                                 stripe | complimentary | manual
--
-- Acesso comercial (catálogo público) é decidido em tempo real por
-- store_has_access(); o job de normalização só mantém os dados coerentes.
--
-- Esta migration é idempotente: pode ser executada de novo sem efeito.

-- ========== 1. stores.status ==========
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'stores'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table stores drop constraint %I', c.conname);
  end loop;
end $$;

update stores set status = 'suspended' where status = 'inactive';

alter table stores
  add constraint stores_status_check check (status in ('active', 'suspended', 'archived'));

-- ========== 2. store_subscriptions ==========
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'store_subscriptions'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table store_subscriptions drop constraint %I', c.conname);
  end loop;
end $$;

-- 'unpaid' do Stripe passa a ser tratado como past_due (mesmo tratamento de
-- acesso; o vocabulário local fica com 5 estados).
update store_subscriptions set status = 'past_due' where status = 'unpaid';

alter table store_subscriptions
  add constraint store_subscriptions_status_check
  check (status in ('trialing', 'active', 'past_due', 'canceled', 'expired'));

alter table store_subscriptions add column if not exists billing_type text not null default 'manual';
alter table store_subscriptions add column if not exists trial_started_at timestamptz;

alter table store_subscriptions drop constraint if exists store_subscriptions_billing_type_check;
alter table store_subscriptions
  add constraint store_subscriptions_billing_type_check
  check (billing_type in ('stripe', 'complimentary', 'manual'));

-- Linhas que já têm assinatura Stripe real.
update store_subscriptions set billing_type = 'stripe'
where stripe_subscription_id is not null and billing_type = 'manual';

-- ========== 3. Trigger: toda loja nova nasce em trial de 30 dias ==========
-- SECURITY DEFINER porque store_subscriptions não tem policy de insert para
-- authenticated (escrita só via service_role/webhook, ver 0029). O webhook do
-- Stripe faz upsert por store_id e atualiza ESTA mesma linha ao assinar.
create or replace function create_trial_subscription()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into store_subscriptions (store_id, status, billing_type, trial_started_at, trial_ends_at)
  values (new.id, 'trialing', 'manual', now(), now() + interval '30 days')
  on conflict (store_id) do nothing;
  return new;
end;
$$;

revoke all on function create_trial_subscription() from public;

drop trigger if exists trg_stores_create_trial on stores;
create trigger trg_stores_create_trial after insert on stores
  for each row execute function create_trial_subscription();

-- ========== 4. Backfill (idempotente) ==========
-- Lojas existentes sem assinatura ganham 30 dias a partir de agora. A
-- blessing-collection (cliente real) fica de fora: recebe cortesia abaixo.
insert into store_subscriptions (store_id, status, billing_type, trial_started_at, trial_ends_at)
select s.id, 'trialing', 'manual', now(), now() + interval '30 days'
from stores s
where s.slug <> 'blessing-collection'
  and not exists (select 1 from store_subscriptions ss where ss.store_id = s.id);

-- Blessing: active + complimentary, sem trial e sem Stripe. Só toca a linha
-- se ela não tiver assinatura Stripe real (nunca sobrescreve um cliente pago).
insert into store_subscriptions (store_id, status, billing_type, trial_started_at, trial_ends_at, stripe_subscription_id)
select s.id, 'active', 'complimentary', null, null, null
from stores s
where s.slug = 'blessing-collection'
on conflict (store_id) do update
  set status = 'active',
      billing_type = 'complimentary',
      trial_started_at = null,
      trial_ends_at = null
  where store_subscriptions.stripe_subscription_id is null;

-- ========== 5. Regra de acesso comercial (fonte única) ==========
-- Acesso quando: status active, OU trialing com trial_ends_at no futuro, OU
-- billing_type complimentary. Avaliada em tempo real — não depende de cron.
-- SECURITY DEFINER para o catálogo público (anon) poder perguntar sem ler
-- store_subscriptions (RLS só deixa o dono ler); devolve apenas um boolean,
-- nunca dados de cobrança.
-- Espelhada em TypeScript por hasSubscriptionAccess() (lib/billing/access.ts).
create or replace function store_has_access(p_store_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select ss.status = 'active'
        or (ss.status = 'trialing' and ss.trial_ends_at is not null and ss.trial_ends_at > now())
        or ss.billing_type = 'complimentary'
    from store_subscriptions ss
    where ss.store_id = p_store_id
  ), false);
$$;

revoke all on function store_has_access(uuid) from public;
grant execute on function store_has_access(uuid) to anon, authenticated;

-- ========== 6. Normalização diária (cosmética, não é fonte de bloqueio) ==========
create or replace function normalize_expired_trials()
returns integer
language plpgsql security definer set search_path = public as $$
declare affected integer;
begin
  update store_subscriptions
  set status = 'expired'
  where status = 'trialing'
    and trial_ends_at is not null
    and trial_ends_at <= now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function normalize_expired_trials() from public;

-- Agenda via pg_cron quando a extensão estiver disponível. Se não estiver
-- (ou faltar permissão), a migration segue — o acesso continua correto
-- porque store_has_access() olha trial_ends_at direto.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule('normalize-expired-trials')
    where exists (select 1 from cron.job where jobname = 'normalize-expired-trials');
  perform cron.schedule('normalize-expired-trials', '5 3 * * *', 'select normalize_expired_trials()');
exception when others then
  raise notice 'pg_cron indisponível (%): agende normalize_expired_trials() manualmente se quiser.', sqlerrm;
end $$;
