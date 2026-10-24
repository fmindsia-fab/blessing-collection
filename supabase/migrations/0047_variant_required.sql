-- Variação de escolha obrigatória x complemento (pedido do usuário, 24/10/2026).
--
-- Numa mesma peça, algumas opções são de ESCOLHA OBRIGATÓRIA (a cliente precisa escolher uma delas
-- para comprar, ex.: a alça de madeira ou a metálica, que mudam o preço) e outras são
-- COMPLEMENTOS, opcionais (ex.: um tiracolo extra). O que decide é a variação: marcadas como
-- obrigatórias formam um conjunto ("escolha uma"); as demais do mesmo grupo formam o conjunto dos
-- complementos ("se quiser").
--
-- Só ACRESCENTA uma coluna com padrão `false`: todas as variações que já existem continuam
-- exatamente como eram (opcionais) até a dona marcar as obrigatórias. Nada é alterado ou apagado.

alter table product_variants add column if not exists is_required boolean not null default false;
