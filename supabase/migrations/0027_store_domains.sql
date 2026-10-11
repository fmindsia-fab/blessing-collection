-- Domínios customizados por loja (Milestone 1 da evolução para SaaS
-- multi-tenant — ver plano de arquitetura). Mapeia um domínio próprio
-- (ex.: blessing.com.br) para a loja correspondente, resolvido pelo
-- proxy.ts/get-active-store.ts. Lojas sem domínio próprio usam só o
-- subdomínio automático (slug.PLATFORM_DOMAIN) e não têm linha aqui.

create table store_domains (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  domain text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_store_domains_store on store_domains(store_id);

create trigger trg_store_domains_updated_at before update on store_domains
  for each row execute function set_updated_at();

alter table store_domains enable row level security;

create policy "store_domains_public_read" on store_domains for select
  using (true);

create policy "store_domains_owner_all" on store_domains for all
  using (exists (
    select 1 from stores s
    where s.id = store_domains.store_id and s.owner_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from stores s
    where s.id = store_domains.store_id and s.owner_user_id = auth.uid()
  ));
