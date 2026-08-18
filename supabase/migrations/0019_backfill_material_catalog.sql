-- Migra materiais avulsos (digitados antes da migration 0018) para o
-- catálogo, e vincula as linhas existentes ao item criado.
--
-- Sem isso, peças já cadastradas continuam com material_id nulo e o material
-- some do seletor de "Formação de preço" mesmo já estando em uso — o
-- catálogo em /admin/materiais fica vazio até a proprietária redigitar tudo.
--
-- Agrupa por loja + nome em minúsculas: "Etiqueta" e "ETIQUETA" viram um
-- único item de catálogo (pedido do usuário), usando o preço e a unidade da
-- ocorrência mais recente — não faz sentido herdar um preço desatualizado só
-- porque a grafia daquela linha veio primeiro no id.

-- ========== 1. Cria um material de catálogo por (loja, nome normalizado) ==========
-- `distinct on` com `order by created_at desc` pega sempre a ocorrência mais
-- recente de cada grupo — é dela que vêm nome/unidade/preço do novo item. Cada
-- linha de `latest` já é um grupo (loja, nome normalizado) único, então não
-- precisa de `group by` nem de outro join com `products` aqui.
insert into materials (store_id, name, unit, unit_cost, sort_order)
select
  latest.store_id,
  latest.description,
  latest.unit,
  latest.unit_cost,
  row_number() over (partition by latest.store_id order by latest.created_at)
    -- Continua a sequência depois dos materiais que já existirem no catálogo,
    -- em vez de reiniciar do zero e embaralhar a ordem de exibição.
    + coalesce((select max(m.sort_order) + 1 from materials m where m.store_id = latest.store_id), 0)
    - 1 as sort_order
from (
  select distinct on (pr.store_id, lower(pm.description))
    pr.store_id,
    pm.description,
    pm.unit,
    pm.unit_cost,
    pm.created_at
  from product_materials pm
  join products pr on pr.id = pm.product_id
  where pm.material_id is null
  order by pr.store_id, lower(pm.description), pm.created_at desc
) as latest
-- Sem constraint de unicidade em (store_id, name): a guarda de idempotência é
-- explícita, para a migration poder ser reexecutada sem duplicar itens caso
-- algo interrompa a primeira rodada no meio.
where not exists (
  select 1 from materials m
  where m.store_id = latest.store_id and lower(m.name) = lower(latest.description)
);

-- ========== 2. Vincula as linhas avulsas ao material recém-criado ==========
-- O nome do material criado no passo 1 já é a versão mais recente do grupo,
-- então o join por loja + nome normalizado é suficiente para achar o par certo.
update product_materials pm
set material_id = m.id
from products pr, materials m
where pr.id = pm.product_id
  and pm.material_id is null
  and m.store_id = pr.store_id
  and lower(m.name) = lower(pm.description);
