-- Assinatura de billing por loja (Milestone 3 da evolução para SaaS
-- multi-tenant). 1:1 com stores — histórico de upgrade/downgrade fica no
-- próprio Stripe, não aqui.
--
-- status espelha os status nativos do Stripe (trialing, active, past_due,
-- canceled, unpaid) em vez de reinventar um enum próprio: facilita manter o
-- webhook sincronizado sem tradução de vocabulário.
--
-- stripe_subscription_id é nullable para suportar o caso "cortesia" (ex. a
-- própria Blessing, Milestone 5): status=active sem assinatura real por
-- trás, mesma fonte única de verdade de billing para os dois casos.

create table store_subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references stores(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'trialing'
    check (status in ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  price_id text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_store_subscriptions_store on store_subscriptions(store_id);
create index idx_store_subscriptions_stripe_customer on store_subscriptions(stripe_customer_id);

create trigger trg_store_subscriptions_updated_at before update on store_subscriptions
  for each row execute function set_updated_at();

alter table store_subscriptions enable row level security;

-- Leitura: só a própria dona da loja vê o status da própria assinatura.
create policy "store_subscriptions_owner_read" on store_subscriptions for select
  using (exists (
    select 1 from stores s
    where s.id = store_subscriptions.store_id and s.owner_user_id = auth.uid()
  ));

-- Escrita: só via webhook do Stripe com service_role_key (bypassa RLS por
-- design do Supabase) — nenhuma policy de insert/update/delete para
-- anon/authenticated. Primeiro uso real de service_role_key no projeto,
-- isolado em app/api/webhooks/stripe/route.ts.
