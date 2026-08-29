-- Multi-tenant self-service: tipo de negócio por loja + 1 usuário = 1 loja.
--
-- business_type guia só a apresentação do cadastro de produto (chips de
-- tamanho/numeração sugeridos) — não estrutura schema novo. product_variants
-- .size já é texto livre (migration 0016) e continua sendo a fonte de
-- verdade; os presets por segmento vivem em código (lib/products/size-presets.ts).
--
-- text + check, não enum Postgres: mesmo padrão já usado em status,
-- tax_regime, pricing_method — mais simples de estender com um 4º segmento
-- no futuro do que ALTER TYPE.

alter table stores
  add column business_type text not null default 'artisan'
  check (business_type in ('artisan', 'clothing', 'footwear'));

-- 1 usuário = 1 loja (confirmado com o usuário). Simplifica a resolução da
-- loja no admin: sempre há no máximo um resultado para owner_user_id.
alter table stores
  add constraint stores_owner_user_id_unique unique (owner_user_id);
