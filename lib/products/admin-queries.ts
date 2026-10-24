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
      .select("id, name, color, color_id, variant_group, size, price, status, is_required, allow_multiple, sort_order")
      .eq("product_id", product.id)
      .neq("status", "archived")
      .order("sort_order", { ascending: true }),
  ]);

  return { product, images: images ?? [], variants: variants ?? [] };
}

// Miniaturas do painel: a foto de capa (ou a primeira) de cada peça, numa única
// consulta (sem N+1). Só leitura, mesma RLS de getProductForAdmin.
export async function getProductCoverUrls(productIds: string[]): Promise<Record<string, string>> {
  if (productIds.length === 0) return {};

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("product_images")
    .select("product_id, url, is_cover, sort_order")
    .in("product_id", productIds)
    .order("is_cover", { ascending: false })
    .order("sort_order", { ascending: true });

  const covers: Record<string, string> = {};
  for (const image of data ?? []) {
    // A ordenação já põe a capa primeiro; só guarda a primeira de cada peça.
    if (!(image.product_id in covers)) covers[image.product_id] = image.url;
  }
  return covers;
}
