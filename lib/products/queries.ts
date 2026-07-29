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

export async function listProducts({
  storeId,
  page = 1,
  categoryId,
  collectionId,
  search,
}: {
  storeId: string;
  page?: number;
  categoryId?: string;
  collectionId?: string;
  search?: string;
}) {
  const supabase = await createServerSupabaseClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("products")
    .select("id, name, slug, price, status", { count: "exact" })
    .eq("store_id", storeId)
    .in("status", PUBLIC_STATUSES)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (collectionId) query = query.eq("collection_id", collectionId);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data: products, count, error } = await query;
  if (error || !products) return { products: [], total: 0, hasMore: false };

  const coverByProduct = await withCoverImages(supabase, products);

  return {
    products: products.map((p) => ({
      ...p,
      cover_image_url: coverByProduct.get(p.id) ?? null,
    })),
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

export async function getProductBySlug(storeId: string, slug: string) {
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
      .order("sort_order", { ascending: true }),
  ]);

  return {
    product,
    images: images ?? [],
    variants: variants ?? [],
  };
}
