-- "Pode escolher mais de uma" por grupo de variação (pedido do usuário, 24/10/2026).
--
-- Até aqui, de cada grupo (ou de cada conjunto obrigatório/complemento) a cliente escolhia UMA
-- opção. Em grupos como "Alça" ela pode querer duas ou mais; já em "Cor" só faz sentido uma. Esta
-- coluna marca os grupos em que várias escolhas são permitidas. A aplicação mantém o valor igual
-- em todas as variações do mesmo grupo da peça (marcar numa vale para o grupo todo).
--
-- Só ACRESCENTA uma coluna com padrão `false`: tudo que existe hoje continua exatamente como era
-- (uma escolha por grupo) até a dona marcar. Nada é alterado ou apagado.

alter table product_variants add column if not exists allow_multiple boolean not null default false;
