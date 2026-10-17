-- Endurecimento de segurança (auditoria de 2026-10-17).
--
-- 1) profiles.is_platform_admin: a policy profile_update_own (0003) deixava
--    qualquer usuário logado atualizar a PRÓPRIA linha inteira — inclusive a
--    flag de administrador da plataforma — e profile_insert_own permitia criar
--    a linha já com a flag true. Resultado: auto-promoção a admin pela API.
-- 2) stores: a policy stores_owner_all deixava o dono alterar status
--    (reativar uma loja SUSPENSA pela plataforma), slug (a URL pública) e
--    owner_user_id. Esses campos são administrativos.
-- 3) stores.slug sem formato no banco: entra em URLs de redirecionamento
--    (https://<slug>.<domínio>/admin); só a validação da aplicação o protegia.
-- 4) Buckets de Storage sem limite de tamanho/tipo: qualquer dono de loja
--    (inclusive em teste grátis) podia subir arquivos arbitrários e enormes
--    direto pela API, sem passar pelas validações das server actions.
--
-- Os gatilhos distinguem "usuário final" (JWT com auth.uid()) de operação
-- administrativa (SQL Editor / service_role: auth.uid() é nulo). Idempotente.

-- ========== 1. profiles ==========
create or replace function guard_profile_privileged_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' and coalesce(new.is_platform_admin, false) then
      raise exception 'is_platform_admin não pode ser definido por usuários' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and new.is_platform_admin is distinct from old.is_platform_admin then
      raise exception 'is_platform_admin não pode ser alterado por usuários' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_guard_privileged on profiles;
create trigger trg_profiles_guard_privileged
  before insert or update on profiles
  for each row execute function guard_profile_privileged_columns();

-- ========== 2. stores ==========
create or replace function guard_store_privileged_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Administrador da plataforma (e SQL/service_role) pode; dono comum não.
  if auth.uid() is not null and not is_platform_admin() then
    if new.status is distinct from old.status then
      raise exception 'status da loja só pode ser alterado pela plataforma' using errcode = '42501';
    end if;
    if new.owner_user_id is distinct from old.owner_user_id then
      raise exception 'dono da loja não pode ser alterado' using errcode = '42501';
    end if;
    if new.slug is distinct from old.slug then
      raise exception 'endereço da loja não pode ser alterado' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stores_guard_privileged on stores;
create trigger trg_stores_guard_privileged
  before update on stores
  for each row execute function guard_store_privileged_columns();

-- ========== 3. formato do slug ==========
-- Mesma regra de lib/onboarding/schema.ts (SLUG_PATTERN): minúsculas, dígitos
-- e hífen (nunca nas pontas), 3 a 63 caracteres.
alter table stores drop constraint if exists stores_slug_format;
alter table stores
  add constraint stores_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$');

-- ========== 4. limites dos buckets ==========
-- Espelham as validações das server actions / do upload direto do navegador.
update storage.buckets
set file_size_limit = 10 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'product-images';

update storage.buckets
set file_size_limit = 40 * 1024 * 1024,
    allowed_mime_types = array['video/mp4', 'video/webm']
where id = 'product-videos';

update storage.buckets
set file_size_limit = 2 * 1024 * 1024,
    allowed_mime_types = array['font/woff2', 'application/octet-stream']
where id = 'brand-fonts';
