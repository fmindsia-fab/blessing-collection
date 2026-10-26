-- Funil de vendas básico (M21 do plano de estoque/financeiro/funil).
--
--  * leads: contatos lançados à mão pela dona (nome, telefone, origem, interesse, valor estimado,
--    próximo retorno) e a etapa em que estão: novo contato -> conversando -> orçamento enviado ->
--    fechado / perdido (com motivo). Pode ficar ligado à cliente e ao pedido que nasceu dele.
--  * lead_events: histórico de mudanças de etapa (livro-razão: só leitura e inclusão), para medir
--    conversão e motivos de perda. É gravado por trigger, então nunca fica de fora.
--
-- Privacidade: os contatos só existem se a dona lançar; o catálogo continua sem identificar
-- visitantes. Segurança: RLS "só a dona" (mesmo padrão de pedidos/compras), sem leitura pública.
-- Nada é apagado: "excluir" vira status = 'archived'. Idempotente.

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  phone text check (phone is null or char_length(phone) <= 30),
  source text not null default 'other'
    check (source in ('whatsapp', 'instagram', 'referral', 'fair', 'website', 'other')),
  interest text check (interest is null or char_length(interest) <= 200),
  stage text not null default 'new' check (stage in ('new', 'talking', 'quoted', 'won', 'lost')),
  estimated_value numeric(10,2) not null default 0 check (estimated_value >= 0),
  next_followup date,
  lost_reason text check (lost_reason is null or char_length(lost_reason) <= 200),
  notes text check (notes is null or char_length(notes) <= 1000),
  customer_id uuid references customers(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'archived')),
  stage_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leads_store_stage on leads(store_id, stage) where status = 'active';
create index if not exists idx_leads_store_followup on leads(store_id, next_followup) where status = 'active' and next_followup is not null;

drop trigger if exists trg_leads_updated_at on leads;
create trigger trg_leads_updated_at before update on leads
  for each row execute function set_updated_at();

alter table leads enable row level security;

drop policy if exists "leads_owner_all" on leads;
create policy "leads_owner_all" on leads for all
  using (exists (
    select 1 from stores s
    where s.id = leads.store_id and s.owner_user_id = (select auth.uid())))
  with check (exists (
    select 1 from stores s
    where s.id = leads.store_id and s.owner_user_id = (select auth.uid())));

create table if not exists lead_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  from_stage text check (from_stage is null or from_stage in ('new', 'talking', 'quoted', 'won', 'lost')),
  to_stage text not null check (to_stage in ('new', 'talking', 'quoted', 'won', 'lost')),
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_events_lead on lead_events(lead_id, created_at);
create index if not exists idx_lead_events_store on lead_events(store_id, created_at desc);

alter table lead_events enable row level security;

-- Só leitura e inclusão: o histórico não é editado nem apagado.
drop policy if exists "lead_events_owner_select" on lead_events;
create policy "lead_events_owner_select" on lead_events for select
  using (exists (
    select 1 from stores s
    where s.id = lead_events.store_id and s.owner_user_id = (select auth.uid())));

drop policy if exists "lead_events_owner_insert" on lead_events;
create policy "lead_events_owner_insert" on lead_events for insert
  with check (exists (
    select 1 from stores s
    where s.id = lead_events.store_id and s.owner_user_id = (select auth.uid())));

-- Antes de gravar: marca quando a etapa mudou e limpa o motivo se o contato deixou de ser "perdido".
create or replace function leads_before_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.stage is distinct from old.stage then
    new.stage_changed_at := now();
  end if;
  if new.stage <> 'lost' then
    new.lost_reason := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_leads_before_update on leads;
create trigger trg_leads_before_update before update on leads
  for each row execute function leads_before_update();

-- Depois de gravar: registra a entrada no funil e cada mudança de etapa.
create or replace function leads_log_stage()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into lead_events (store_id, lead_id, from_stage, to_stage)
    values (new.store_id, new.id, null, new.stage);
  elsif new.stage is distinct from old.stage then
    insert into lead_events (store_id, lead_id, from_stage, to_stage)
    values (new.store_id, new.id, old.stage, new.stage);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_leads_log_stage on leads;
create trigger trg_leads_log_stage after insert or update of stage on leads
  for each row execute function leads_log_stage();
