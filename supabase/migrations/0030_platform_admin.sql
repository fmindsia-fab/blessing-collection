-- Painel do administrador da plataforma (Milestone 4 da evolução SaaS).
-- is_platform_admin é uma flag manual (não self-service) — só o dono do
-- SaaS marca essa coluna diretamente no banco para si mesmo. Não reaproveita
-- owner_user_id de stores porque o dono da plataforma não é dono de uma
-- loja-tenant; é uma permissão de operação da própria plataforma.

alter table profiles add column is_platform_admin boolean not null default false;

-- SECURITY DEFINER: evita recursão de RLS (uma policy de `profiles` que
-- fizesse `select ... from profiles` dentro de si mesma reavaliaria a
-- própria policy). A função roda com privilégios do dono, ignorando RLS só
-- para esta checagem pontual — nunca expõe dado nenhum além do boolean.
create or replace function is_platform_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_platform_admin from profiles p where p.id = auth.uid()), false);
$$;

revoke all on function is_platform_admin() from public;
grant execute on function is_platform_admin() to authenticated;

-- Leitura: a própria pessoa lê seu perfil (já coberto por profile_select_own
-- em 0003); platform admin também pode ler qualquer profile, necessário
-- para listar o dono de cada loja no painel.
create policy "profile_select_platform_admin" on profiles for select
  using (is_platform_admin());

create policy "stores_platform_admin_read" on stores for select
  using (is_platform_admin());

create policy "stores_platform_admin_update" on stores for update
  using (is_platform_admin())
  with check (is_platform_admin());

create policy "store_subscriptions_platform_admin_read" on store_subscriptions for select
  using (is_platform_admin());
