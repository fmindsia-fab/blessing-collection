-- Dados de quem cadastra a loja: nome (profiles.full_name, já existente) e CPF.
-- O CPF fica só em profiles — nunca em analytics_events nem em tabelas
-- públicas. RLS de profiles já restringe leitura/escrita à própria pessoa e
-- ao platform admin (0003 e 0030); nenhuma policy nova é necessária.

alter table profiles add column cpf text;

alter table profiles
  add constraint profiles_cpf_format check (cpf is null or cpf ~ '^[0-9]{11}$');

-- O e-mail do dono vive em auth.users, que não é acessível via PostgREST.
-- RPC SECURITY DEFINER restrita a platform admin: devolve só o e-mail do
-- dono da loja pedida, nada além disso.
create or replace function platform_admin_store_owner_email(p_store_id uuid)
returns text
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_platform_admin() then
    return null;
  end if;

  return (
    select u.email::text
    from stores s
    join auth.users u on u.id = s.owner_user_id
    where s.id = p_store_id
  );
end;
$$;

revoke all on function platform_admin_store_owner_email(uuid) from public;
grant execute on function platform_admin_store_owner_email(uuid) to authenticated;
