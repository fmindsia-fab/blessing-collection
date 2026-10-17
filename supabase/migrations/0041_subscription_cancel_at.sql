-- Data do cancelamento agendado da assinatura.
--
-- Nas versões atuais da API do Stripe, o cancelamento pedido no portal ("cancelar
-- no fim do período") chega como `cancel_at` (data) e o campo antigo
-- `cancel_at_period_end` pode continuar false. Guardamos a data para mostrar
-- "cancelamento agendado para dd/mm" e saber quando o acesso termina. O booleano
-- cancel_at_period_end (0040) passa a significar "há cancelamento agendado",
-- seja por qual dos dois campos o Stripe o represente.
-- Idempotente.

alter table store_subscriptions add column if not exists cancel_at timestamptz;
