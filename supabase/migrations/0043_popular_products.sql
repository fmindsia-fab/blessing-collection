-- "Mais procuradas" na página inicial do catálogo.
--
-- Por que existe: o ranking de visitas (get_product_rankings) só pode ser lido pela dona da loja,
-- porque analytics_events tem RLS de leitura "apenas o dono" (de propósito). O catálogo público
-- não consegue usá-lo. Esta função expõe o MÍNIMO necessário para a vitrine: apenas os IDs das
-- peças públicas, na ordem de procura, SEM contagens, datas ou qualquer dado de visitante.
--
-- Segurança (SECURITY DEFINER lê analytics_events por cima da RLS, então fica bem fechada):
--  * `set search_path = public` evita sequestro de nomes por outro schema.
--  * Só devolve peças que o visitante já enxerga hoje (mesmo critério da policy
--    products_public_read_visible: status público + loja ativa). Peças inativas nunca saem.
--  * Devolve só `product_id`: nenhum número de visitas/cliques fica exposto.
--  * Exige pelo menos 3 eventos por peça, para não "ranquear" uma peça por 1 visita isolada.
--  * Parâmetros são limitados (janela de 1 a 365 dias, no máximo 12 peças).
--  * Permissão: revogada de PUBLIC e concedida só a anon/authenticated (o catálogo público).
--
-- Só CRIA uma função nova: nenhuma tabela, policy ou dado existente é alterado.

create or replace function get_popular_product_ids(
  p_store_id uuid,
  p_days int default 30,
  p_limit int default 8
)
returns table (product_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from products p
  join stores s on s.id = p.store_id and s.status = 'active'
  join analytics_events e on e.product_id = p.id and e.store_id = p.store_id
  where p.store_id = p_store_id
    and p.status in ('available', 'made_to_order', 'sold_out')
    and e.event_type in ('product_view', 'whatsapp_click')
    and e.created_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)))
  group by p.id
  having count(*) >= 3
  order by
    count(*) filter (where e.event_type = 'whatsapp_click') desc,
    count(*) filter (where e.event_type = 'product_view') desc,
    p.id
  limit greatest(1, least(coalesce(p_limit, 8), 12));
$$;

revoke all on function get_popular_product_ids(uuid, int, int) from public;
grant execute on function get_popular_product_ids(uuid, int, int) to anon, authenticated;
