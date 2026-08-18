-- Padroniza os nomes dos materiais do catálogo em caixa alta (pedido do
-- usuário). Correção pontual nos dados existentes — cadastro novo continua
-- exatamente como for digitado no formulário.
update materials
set name = upper(name)
where name <> upper(name);
