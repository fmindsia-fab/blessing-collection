-- Leitura pública das formas de pagamento (pedido do usuário: mostrar o
-- parcelamento no catálogo).
--
-- A migration 0014 deixou `payment_methods` restrita à proprietária, junto com
-- os dados de custo. Mas o parcelamento exibido à cliente é calculado a partir
-- das taxas, então elas precisam chegar ao catálogo.
--
-- Expor a taxa da adquirente é diferente de expor custo e margem: é informação
-- que a própria cliente enxerga na fatura do cartão, e não revela quanto a peça
-- custou para produzir. `product_materials` continua restrita.
create policy "payment_methods_public_read_active" on payment_methods for select
  using (
    status = 'active'
    and exists (select 1 from stores s where s.id = payment_methods.store_id and s.status = 'active')
  );
