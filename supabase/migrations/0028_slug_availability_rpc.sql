-- RPC de checagem de disponibilidade de slug para o onboarding self-service
-- (Milestone 2). SECURITY DEFINER porque stores_public_read_active só
-- permite ler lojas com status='active' — sem isto, um slug de loja
-- inativa pareceria "disponível" e colidiria no insert (unique idx_stores_slug).
-- Só retorna um boolean: nunca vaza dado nenhum da loja encontrada.

create or replace function is_store_slug_available(p_slug text)
returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from stores where slug = p_slug);
$$;

revoke all on function is_store_slug_available(text) from public;
grant execute on function is_store_slug_available(text) to anon, authenticated;
