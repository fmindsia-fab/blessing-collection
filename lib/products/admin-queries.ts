import { createServerSupabaseClient } from "@/lib/supabase/server";

// Inclui todos os status (inclusive inactive) — uso exclusivo do painel administrativo.
export async function listAllProductsForAdmin(storeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, slug, price, status, is_featured, is_new_arrival, category_id")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getProductForAdmin(storeId: string, productId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .eq("id", productId)
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
      .select("id, name, color, color_id, variant_group, size, price, status, sort_order")
      .eq("product_id", product.id)
      .neq("status", "archived")
      .order("sort_order", { ascending: true }),
  ]);

  return { product, images: images ?? [], variants: variants ?? [] };
}
