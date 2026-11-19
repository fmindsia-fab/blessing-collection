import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProductCoverUrls } from "@/lib/products/admin-queries";
import type { PrintProduct } from "@/lib/catalog/print-sheet";

/**
 * Peças à venda (pronta entrega e sob encomenda) para o catálogo impresso, com foto
 * de capa e se o valor é "a partir de". Esgotadas e inativas ficam de fora: não há o
 * que oferecer numa folha impressa. Uso exclusivo do painel (RLS da proprietária).
 */
export async function listProductsForPrint(storeId: string): Promise<PrintProduct[]> {
  const supabase = await createServerSupabaseClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, status, category_id")
    .eq("store_id", storeId)
    .in("status", ["available", "made_to_order"])
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!products || products.length === 0) return [];

  const ids = products.map((product) => product.id);
  const [covers, { data: variants }] = await Promise.all([
    getProductCoverUrls(ids),
    supabase.from("product_variants").select("product_id, price").in("product_id", ids).neq("status", "archived"),
  ]);

  // Mesma regra do cartão do catálogo: variação mais cara que o preço base => "a partir de".
  const priceById = new Map(products.map((product) => [product.id, product.price]));
  const fromPriceIds = new Set<string>();
  for (const variant of variants ?? []) {
    const base = priceById.get(variant.product_id) ?? 0;
    if (variant.price != null && variant.price > base) fromPriceIds.add(variant.product_id);
  }

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    status: product.status as PrintProduct["status"],
    fromPrice: fromPriceIds.has(product.id),
    coverUrl: covers[product.id] ?? null,
    categoryId: product.category_id,
  }));
}
