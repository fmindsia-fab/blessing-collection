-- ETAPA 2 da correção do vazamento de dados privados (ver 0037_store_private.sql).
--
-- SÓ APLICAR depois que o código que lê/grava `store_private` estiver no ar e
-- testado (Configurações > Pix, Precificação, cobrança do pedido). Esta
-- migration APAGA as colunas antigas de `stores` — é o que realmente fecha o
-- vazamento, porque a policy pública de `stores` expõe a linha inteira.
--
-- Trava de segurança: se alguma loja ainda não tiver linha em store_private,
-- a migration aborta em vez de perder dados.

do $$
declare
  missing integer;
begin
  select count(*) into missing
  from stores s
  where not exists (select 1 from store_private p where p.store_id = s.id);

  if missing > 0 then
    raise exception
      'Abortado: % loja(s) sem linha em store_private. Rode a 0037 antes de apagar as colunas antigas.',
      missing;
  end if;
end $$;

alter table stores drop column if exists pix_key;
alter table stores drop column if exists monthly_pay;
alter table stores drop column if exists monthly_fixed_cost;
alter table stores drop column if exists productive_hours_per_month;
alter table stores drop column if exists tax_regime;
alter table stores drop column if exists tax_percent;
alter table stores drop column if exists default_pricing_method;
alter table stores drop column if exists default_margin_percent;
