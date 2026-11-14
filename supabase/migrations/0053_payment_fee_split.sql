-- Taxa da forma de pagamento separada em duas partes, como o banco mostra:
-- "taxa por venda" (admin) e "taxa de parcelamento" (adicional das parcelas).
--
-- `fee_percent` continua sendo o TOTAL (soma simples das duas) e é o que o
-- catálogo, a precificação e os pedidos leem — por isso nada fora da tela de
-- cadastro muda. A soma simples é a regra confirmada nas simulações do banco.
--
-- Aplicar ANTES de publicar o código: o app novo grava as duas colunas.

alter table payment_methods
  add column if not exists admin_fee_percent numeric(5,2) not null default 0
    check (admin_fee_percent >= 0 and admin_fee_percent < 100),
  add column if not exists installment_fee_percent numeric(5,2) not null default 0
    check (installment_fee_percent >= 0 and installment_fee_percent < 100);

-- Linhas existentes: a taxa atual vira "por venda", sem parcelamento adicional.
update payment_methods
set admin_fee_percent = fee_percent
where admin_fee_percent = 0 and installment_fee_percent = 0 and fee_percent > 0;

-- O total nunca pode divergir das partes (e continua < 100 pelo check original).
alter table payment_methods
  add constraint payment_methods_fee_is_sum
  check (fee_percent = admin_fee_percent + installment_fee_percent);

-- RLS inalterada: as policies de 0014/0015 valem para a tabela inteira.
