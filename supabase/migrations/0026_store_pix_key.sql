-- Chave PIX da loja (pedido do usuário), usada na cobrança que a
-- proprietária monta manualmente para enviar ao cliente pelo WhatsApp
-- (texto livre: CPF, e-mail, telefone ou chave aleatória).

alter table stores add column if not exists pix_key text;
