-- Blessing Collection — schema inicial (Milestone 3)
-- Ver PLAN.md seção 2 para justificativa de cada decisão de design.

create extension if not exists "pgcrypto";

-- ========== PROFILES ==========
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========== STORES ==========
create table stores (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  name text not null,
  description text,
  whatsapp_number text not null,
  logo_url text,
  instagram_url text,
  color_primary text not null default '#000000',
  color_secondary text not null default '#FFFFFF',
  color_accent text not null default '#C9A227',
  font_family text not null default 'playfair-display'
    check (font_family in ('playfair-display','cormorant-garamond','lora','montserrat','inter')),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_stores_owner on stores(owner_user_id);
create unique index idx_stores_slug on stores(slug);

-- ========== CATEGORIES ==========
create table categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  image_url text,
  status text not null default 'active' check (status in ('active','archived')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, slug)
);
create index idx_categories_store on categories(store_id) where status = 'active';

-- ========== COLLECTIONS ==========
create table collections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  image_url text,
  status text not null default 'active' check (status in ('active','archived')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, slug)
);
create index idx_collections_store on collections(store_id) where status = 'active';

-- ========== PRODUCTS ==========
create table products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  collection_id uuid references collections(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  price numeric(10,2) not null,
  materials text,
  measurements text,
  status text not null default 'available'
    check (status in ('available','made_to_order','sold_out','inactive')),
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, slug)
);
create index idx_products_store_status on products(store_id, status);
create index idx_products_category on products(category_id) where status <> 'inactive';
create index idx_products_collection on products(collection_id) where status <> 'inactive';

-- ========== PRODUCT_IMAGES ==========
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order int not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_product_images_product on product_images(product_id, sort_order);
-- Constraint real (não só índice de performance): impede 2 capas para o mesmo produto.
create unique index idx_product_images_one_cover
  on product_images(product_id) where is_cover = true;

-- ========== PRODUCT_VARIANTS ==========
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  color text,
  size text,
  sku text,
  price numeric(10,2),
  status text not null default 'available' check (status in ('available','sold_out')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_product_variants_product on product_variants(product_id);

-- ========== ANALYTICS_EVENTS ==========
-- Sem dados pessoais: sem IP, sem user-agent, sem identificador de visitante.
create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  event_type text not null
    check (event_type in ('product_view','whatsapp_click','category_view','collection_view')),
  product_id uuid references products(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  collection_id uuid references collections(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_analytics_store_type_date on analytics_events(store_id, event_type, created_at desc);
create index idx_analytics_product on analytics_events(product_id, event_type) where product_id is not null;
create index idx_analytics_category on analytics_events(category_id, event_type) where category_id is not null;
create index idx_analytics_collection on analytics_events(collection_id, event_type) where collection_id is not null;
create index idx_analytics_created on analytics_events(created_at desc);
