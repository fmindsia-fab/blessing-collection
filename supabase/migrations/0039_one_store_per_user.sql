-- Regra de negócio "um usuário por loja" (CLAUDE.md) agora também no banco.
--
-- Antes só a aplicação a respeitava (a unicidade foi removida na 0024, quando
-- o produto voltou a ser mono-loja). Sem trava, qualquer usuário podia criar
-- várias lojas pela API e cada uma ganhava um teste grátis de 30 dias
-- (trigger de 0032) — abuso do trial.
--
-- A migration ABORTA se já houver dono com mais de uma loja, em vez de apagar
-- ou escolher qual manter. Idempotente.

do $$
declare
  dup integer;
begin
  select count(*) into dup
  from (
    select owner_user_id from stores group by owner_user_id having count(*) > 1
  ) d;

  if dup > 0 then
    raise exception
      'Abortado: % dono(s) com mais de uma loja. Resolva manualmente antes de aplicar a regra.', dup;
  end if;
end $$;

alter table stores drop constraint if exists stores_owner_user_id_unique;
alter table stores add constraint stores_owner_user_id_unique unique (owner_user_id);
