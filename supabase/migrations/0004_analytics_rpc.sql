-- RPCs de analytics — agregação em uma única query (evita N+1 no dashboard).
-- p_days: 7 | 30 | 90 | null (total). Ver PLAN.md seção 5.
-- SECURITY INVOKER (padrão): roda com os privilégios de quem chama, então a
-- RLS de analytics_events (select apenas para a owner) continua valendo.

create or replace function get_product_rankings(p_store_id uuid, p_days int default null)
returns table (
  product_id uuid,
  product_name text,
  views bigint,
  clicks bigint,
  interest_rate numeric
)
language sql stable as $$
  select
    p.id,
    p.name,
    count(*) filter (where e.event_type = 'product_view') as views,
    count(*) filter (where e.event_type = 'whatsapp_click') as clicks,
    case when count(*) filter (where e.event_type = 'product_view') > 0
      then round(100.0 * count(*) filter (where e.event_type = 'whatsapp_click')
        / count(*) filter (where e.event_type = 'product_view'), 2)
      else 0 end as interest_rate
  from products p
  join analytics_events e on e.product_id = p.id
  where p.store_id = p_store_id
    and (p_days is null or e.created_at >= now() - (p_days || ' days')::interval)
  group by p.id, p.name
  order by clicks desc, views desc
  limit 10;
$$;

create or replace function get_category_rankings(p_store_id uuid, p_days int default null)
returns table (
  category_id uuid,
  category_name text,
  views bigint
)
language sql stable as $$
  select
    c.id,
    c.name,
    count(*) as views
  from categories c
  join analytics_events e on e.category_id = c.id and e.event_type = 'category_view'
  where c.store_id = p_store_id
    and (p_days is null or e.created_at >= now() - (p_days || ' days')::interval)
  group by c.id, c.name
  order by views desc
  limit 10;
$$;

create or replace function get_collection_rankings(p_store_id uuid, p_days int default null)
returns table (
  collection_id uuid,
  collection_name text,
  views bigint
)
language sql stable as $$
  select
    col.id,
    col.name,
    count(*) as views
  from collections col
  join analytics_events e on e.collection_id = col.id and e.event_type = 'collection_view'
  where col.store_id = p_store_id
    and (p_days is null or e.created_at >= now() - (p_days || ' days')::interval)
  group by col.id, col.name
  order by views desc
  limit 10;
$$;
