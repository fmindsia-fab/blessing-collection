-- Cobrança (Stripe): carência de pagamento, cancelamento agendado e proteção do
-- job de expiração.
--
-- 1) Carência de 7 dias: quando a cobrança falha (status past_due) o catálogo
--    continua no ar por 7 dias CONTADOS DO FIM DO PERÍODO JÁ PAGO
--    (current_period_end). O Stripe tenta cobrar de novo e avisa o cliente por
--    e-mail nesse intervalo; passado o prazo sem regularizar, o acesso cai.
--    Espelhada em TypeScript por hasSubscriptionAccess() (lib/billing/access.ts)
--    com a constante PAST_DUE_GRACE_DAYS — se mudar um, mude o outro.
-- 2) cancel_at_period_end: quando o cliente cancela pelo portal o Stripe mantém
--    a assinatura 'active' até o fim do período; guardamos o aviso para mostrar
--    "cancelamento agendado para dd/mm" no painel.
-- 3) normalize_expired_trials() só pode mexer no teste PRÓPRIO (sem assinatura
--    Stripe). Com "preservar os dias restantes do teste" o Stripe passa a ter um
--    trial real (status trialing com trial_ends_at): se o job o marcasse como
--    'expired' na virada, derrubaria quem acabou de pagar até o webhook chegar.
--
-- Idempotente.

alter table store_subscriptions
  add column if not exists cancel_at_period_end boolean not null default false;

create or replace function store_has_access(p_store_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select ss.status = 'active'
        or (ss.status = 'trialing' and ss.trial_ends_at is not null and ss.trial_ends_at > now())
        or (ss.status = 'past_due'
            and ss.current_period_end is not null
            and ss.current_period_end + interval '7 days' > now())
        or ss.billing_type = 'complimentary'
    from store_subscriptions ss
    where ss.store_id = p_store_id
  ), false);
$$;

create or replace function normalize_expired_trials()
returns integer
language plpgsql security definer set search_path = public as $$
declare affected integer;
begin
  update store_subscriptions
  set status = 'expired'
  where status = 'trialing'
    and stripe_subscription_id is null
    and trial_ends_at is not null
    and trial_ends_at <= now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;
