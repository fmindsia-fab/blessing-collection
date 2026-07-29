-- Trigger genérica para manter updated_at sincronizado em toda alteração de linha.

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_stores_updated_at before update on stores
  for each row execute function set_updated_at();

create trigger trg_categories_updated_at before update on categories
  for each row execute function set_updated_at();

create trigger trg_collections_updated_at before update on collections
  for each row execute function set_updated_at();

create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

create trigger trg_product_images_updated_at before update on product_images
  for each row execute function set_updated_at();

create trigger trg_product_variants_updated_at before update on product_variants
  for each row execute function set_updated_at();

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
