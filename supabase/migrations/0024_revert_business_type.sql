-- Reverte a migration 0023 (business_type + unique(owner_user_id)).
--
-- Decisão do usuário: a expansão multi-tenant self-service foi desfeita no
-- código (ver commit de revert). O catálogo volta a ser mono-loja
-- (Blessing Collection), resolvida por STORE_SLUG. Multi-loja fica para um
-- projeto separado no futuro, não este mesmo domínio/produto.

alter table stores
  drop constraint if exists stores_owner_user_id_unique;

alter table stores
  drop column if exists business_type;
