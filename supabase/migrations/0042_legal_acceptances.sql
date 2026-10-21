-- Registro do aceite eletrônico dos Termos de Uso e da Política de Privacidade.
--
-- Uma linha por aceite: quem (user_id), quando (accepted_at), QUAIS versões dos dois
-- documentos a pessoa viu e evidências técnicas proporcionais (IP e navegador) para
-- provar o aceite. Só CRIA uma tabela nova: nenhum dado existente é alterado.
--
-- Proteção contra adulteração:
--  * RLS ligada, com policy só de LEITURA da própria linha. Sem policy de
--    insert/update/delete, então nenhum usuário (anon ou autenticado) consegue gravar
--    ou alterar; quem grava é o servidor da aplicação com a service_role, depois de
--    verificar a sessão/o cadastro (ver lib/legal/acceptance.ts).
--  * O gatilho abaixo proíbe UPDATE até para a service_role: a evidência é imutável.
--    DELETE continua possível, porque a exclusão definitiva de conta (on delete cascade
--    a partir de auth.users) precisa remover as linhas da pessoa (LGPD).
--
-- Contas antigas NÃO recebem linha nenhuma: não se exige novo aceite retroativo
-- automaticamente. Idempotente.

create table if not exists legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null check (char_length(terms_version) between 1 and 40),
  privacy_version text not null check (char_length(privacy_version) between 1 and 40),
  accepted_at timestamptz not null default now(),
  ip_address text check (ip_address is null or char_length(ip_address) <= 64),
  user_agent text check (user_agent is null or char_length(user_agent) <= 300),
  source text not null default 'signup' check (source in ('signup', 'store_creation'))
);

create index if not exists idx_legal_acceptances_user on legal_acceptances(user_id, accepted_at desc);

alter table legal_acceptances enable row level security;

drop policy if exists "legal_acceptances_select_own" on legal_acceptances;
create policy "legal_acceptances_select_own" on legal_acceptances for select
  using ((select auth.uid()) = user_id);

create or replace function forbid_legal_acceptance_update()
returns trigger
language plpgsql
as $$
begin
  raise exception 'legal_acceptances é imutável: o registro de aceite não pode ser alterado'
    using errcode = '42501';
end;
$$;

drop trigger if exists trg_legal_acceptances_immutable on legal_acceptances;
create trigger trg_legal_acceptances_immutable
  before update on legal_acceptances
  for each row execute function forbid_legal_acceptance_update();
