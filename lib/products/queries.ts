import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PUBLIC_STATUSES = ["available", "made_to_order", "sold_out"] as const;
const PAGE_SIZE = 12;

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  status: (typeof PUBLIC_STATUSES)[number] | "inactive";
  cover_image_url: string | null;
  min_variant_price: number | null;
};

async function withCoverImages(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  products: { id: string; price: number }[],
) {
  if (products.length === 0) return new Map<string, string>();

  const { data: images } = await supabase
    .from("product_images")
    .select("product_id, url")
    .in(
      "product_id",
      products.map((p) => p.id),
    )
    .eq("is_cover", true);

  return new Map((images ?? []).map((img) => [img.product_id, img.url]));
}

// Cores disponíveis na loja, para alimentar o filtro da listagem (PRD 3.2).
// Distintas, já normalizadas, ordenadas alfabeticamente.
export async function listAvailableColors(storeId: string): Promise<string[]> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("product_variants")
    .select("color, products!inner(store_id, status)")
    .eq("products.store_id", storeId)
    .in("products.status", PUBLIC_STATUSES)
    .neq("status", "archived")
    .not("color", "is", null);

  const colors = new Set<string>();
  for (const row of (data ?? []) as { color: string | null }[]) {
    const color = row.color?.trim();
    if (color) colors.add(color);
  }

  return [...colors].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export async function listProducts({
  storeId,
  page = 1,
  categoryId,
  collectionId,
  modelId,
  search,
  color,
  availability,
}: {
  storeId: string;
  page?: number;
  categoryId?: string;
  collectionId?: string;
  modelId?: string;
  search?: string;
  color?: string;
  availability?: string;
}) {
  const supabase = await createServerSupabaseClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Filtro por cor precisa de join com as variantes; sem ele, evitamos o join
  // para não pagar o custo em toda listagem.
  const selectClause = color
    ? "id, name, slug, price, status, product_variants!inner(color, status)"
    : "id, name, slug, price, status";

  let query = supabase
    .from("products")
    .select(selectClause, { count: "exact" })
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .range(from, to);

  // Disponibilidade é um subconjunto dos status públicos — nunca amplia o que
  // o visitante enxerga.
  const isPublicStatus = (value: string): value is (typeof PUBLIC_STATUSES)[number] =>
    (PUBLIC_STATUSES as readonly string[]).includes(value);

  const statusFilter: readonly (typeof PUBLIC_STATUSES)[number][] =
    availability && isPublicStatus(availability) ? [availability] : PUBLIC_STATUSES;

  query = query.in("status", statusFilter);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (collectionId) query = query.eq("collection_id", collectionId);
  if (modelId) query = query.eq("model_id", modelId);
  if (search) query = query.ilike("name", `%${search}%`);
  if (color) {
    query = query.eq("product_variants.color", color).neq("product_variants.status", "archived");
  }

  const { data, count, error } = await query;
  if (error || !data) return { products: [], total: 0, hasMore: false };

  // O join do filtro por cor pode repetir o produto quando ele tem mais de uma
  // variante da mesma cor; desduplica por id preservando a ordem.
  const seen = new Set<string>();
  const products = (data as unknown as { id: string; price: number }[]).filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  const coverByProduct = await withCoverImages(supabase, products);

  return {
    products: products.map((p) => ({
      ...p,
      cover_image_url: coverByProduct.get(p.id) ?? null,
    })) as (ProductListItem & { cover_image_url: string | null })[],
    total: count ?? 0,
    hasMore: (count ?? 0) > to + 1,
  };
}

export async function getFeaturedProducts(storeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, status")
    .eq("store_id", storeId)
    .in("status", PUBLIC_STATUSES)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .limit(8);

  if (!products) return [];
  const coverByProduct = await withCoverImages(supabase, products);
  return products.map((p) => ({ ...p, cover_image_url: coverByProduct.get(p.id) ?? null }));
}

export async function getNewArrivals(storeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, status")
    .eq("store_id", storeId)
    .in("status", PUBLIC_STATUSES)
    .eq("is_new_arrival", true)
    .order("created_at", { ascending: false })
    .limit(8);

  if (!products) return [];
  const coverByProduct = await withCoverImages(supabase, products);
  return products.map((p) => ({ ...p, cover_image_url: coverByProduct.get(p.id) ?? null }));
}

/**
 * Peças relacionadas para a página de produto (PRD 3.4).
 *
 * Relevância por proximidade: mesma categoria primeiro, depois mesma coleção,
 * e o restante do catálogo completa se ainda faltar. Sempre exclui o próprio
 * produto. Uma loja pequena raramente tem 4 peças na mesma categoria, então
 * sem o preenchimento a seção apareceria quase sempre vazia.
 */
export async function getRelatedProducts(
  storeId: string,
  product: { id: string; category_id: string | null; collection_id: string | null },
  limit = 4,
) {
  const supabase = await createServerSupabaseClient();
  const selected = new Map<string, { id: string; name: string; slug: string; price: number; status: string }>();

  const fetchBatch = async (filter: (q: ReturnType<typeof buildBase>) => typeof q) => {
    if (selected.size >= limit) return;

    const { data } = await filter(buildBase());
    for (const row of data ?? []) {
      if (row.id !== product.id && !selected.has(row.id)) selected.set(row.id, row);
      if (selected.size >= limit) break;
    }
  };

  function buildBase() {
    return supabase
      .from("products")
      .select("id, name, slug, price, status")
      .eq("store_id", storeId)
      .in("status", PUBLIC_STATUSES)
      .neq("id", product.id)
      .order("sort_order", { ascending: true })
      .limit(limit + 1);
  }

  if (product.category_id) {
    await fetchBatch((q) => q.eq("category_id", product.category_id!));
  }
  if (product.collection_id) {
    await fetchBatch((q) => q.eq("collection_id", product.collection_id!));
  }
  await fetchBatch((q) => q);

  const products = [...selected.values()].slice(0, limit);
  if (products.length === 0) return [];

  const coverByProduct = await withCoverImages(supabase, products);
  return products.map((p) => ({ ...p, cover_image_url: coverByProduct.get(p.id) ?? null }));
}

// cache() deduplica a chamada entre generateMetadata e o componente da página.
export const getProductBySlug = cache(async (storeId: string, slug: string) => {
  const supabase = await createServerSupabaseClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .eq("slug", slug)
    .in("status", PUBLIC_STATUSES)
    .single();

  if (error || !product) return null;

  const [{ data: images }, { data: variants }] = await Promise.all([
    supabase
      .from("product_images")
      .select("id, url, alt_text, is_cover, sort_order")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_variants")
      .select("id, name, color, size, price, status, sort_order")
      .eq("product_id", product.id)
      .neq("status", "archived")
      .order("sort_order", { ascending: true }),
  ]);

  return {
    product,
    images: images ?? [],
    variants: variants ?? [],
  };
});
