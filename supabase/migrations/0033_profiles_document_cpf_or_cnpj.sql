-- O cadastro passa a aceitar CPF (11 dígitos) ou CNPJ (14 dígitos). A coluna
-- profiles.cpf (0031) vira profiles.document — o nome antigo ficaria
-- enganoso. Sem policy nova: o RLS de profiles continua o mesmo.
-- Idempotente: pode ser executada de novo sem efeito.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'cpf'
  ) then
    alter table profiles rename column cpf to document;
  end if;
end $$;

alter table profiles drop constraint if exists profiles_cpf_format;
alter table profiles drop constraint if exists profiles_document_format;

alter table profiles
  add constraint profiles_document_format
  check (document is null or document ~ '^([0-9]{11}|[0-9]{14})$');
