import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function listCategories(storeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, image_url")
    .eq("store_id", storeId)
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  return data ?? [];
}

/**
 * Categorias que têm peças no catálogo, com a contagem de cada uma.
 *
 * Mesma razão de `listModelsInUse`: a loja tem 5 categorias cadastradas e
 * peças em 2 — as outras 3 levariam a "nenhuma peça encontrada".
 */
export async function listCategoriesInUse(storeId: string) {
  const supabase = await createServerSupabaseClient();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("store_id", storeId)
      .eq("status", "active")
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("category_id")
      .eq("store_id", storeId)
      .in("status", ["available", "made_to_order", "sold_out"])
      .not("category_id", "is", null),
  ]);

  const countByCategory = new Map<string, number>();
  for (const product of products ?? []) {
    if (!product.category_id) continue;
    countByCategory.set(product.category_id, (countByCategory.get(product.category_id) ?? 0) + 1);
  }

  return (categories ?? [])
    .filter((category) => countByCategory.has(category.id))
    .map((category) => ({ ...category, count: countByCategory.get(category.id)! }));
}

// Inclui categorias arquivadas — uso exclusivo do painel administrativo.
export async function listAllCategoriesForAdmin(storeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, description, status")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

export async function getCategoryBySlug(storeId: string, slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .eq("store_id", storeId)
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  return data;
}
