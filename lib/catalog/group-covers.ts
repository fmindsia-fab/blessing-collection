import { createServerSupabaseClient } from "@/lib/supabase/server";

const PUBLIC_STATUSES = ["available", "made_to_order", "sold_out"] as const;

async function pickCovers(
  storeId: string,
  column: "category_id" | "collection_id",
): Promise<Map<string, string>> {
  const supabase = await createServerSupabaseClient();

  const { data: products } =
    column === "category_id"
      ? await supabase
          .from("products")
          .select("id, category_id")
          .eq("store_id", storeId)
          .in("status", PUBLIC_STATUSES)
          .not("category_id", "is", null)
      : await supabase
          .from("products")
          .select("id, collection_id")
          .eq("store_id", storeId)
          .in("status", PUBLIC_STATUSES)
          .not("collection_id", "is", null);

  if (!products || products.length === 0) return new Map();

  const { data: images } = await supabase
    .from("product_images")
    .select("product_id, url")
    .in(
      "product_id",
      products.map((p) => p.id),
    )
    .eq("is_cover", true);

  const coverByProduct = new Map((images ?? []).map((img) => [img.product_id, img.url]));

  const candidatesByGroup = new Map<string, string[]>();
  for (const product of products as { id: string; category_id?: string; collection_id?: string }[]) {
    const groupId = column === "category_id" ? product.category_id : product.collection_id;
    const cover = coverByProduct.get(product.id);
    if (!groupId || !cover) continue;

    const list = candidatesByGroup.get(groupId) ?? [];
    list.push(cover);
    candidatesByGroup.set(groupId, list);
  }

  const coverByGroup = new Map<string, string>();
  for (const [groupId, covers] of candidatesByGroup) {
    coverByGroup.set(groupId, covers[Math.floor(Math.random() * covers.length)]);
  }

  return coverByGroup;
}

/**
 * Sorteia uma foto de capa por categoria, a partir das peças públicas que
 * pertencem a ela — usado nos cards de vitrine da home (Categorias/Coleções),
 * que não têm upload de imagem própria.
 *
 * O sorteio acontece no servidor a cada carregamento (pedido do usuário: a
 * foto muda a cada atualização da página), não no client — mesma razão de
 * pickHeroProduct: a imagem já vem pronta no HTML, sem trocar na frente da
 * cliente depois da hidratação.
 */
export function pickCategoryCovers(storeId: string): Promise<Map<string, string>> {
  return pickCovers(storeId, "category_id");
}

/** Mesma lógica de pickCategoryCovers, para coleções. */
export function pickCollectionCovers(storeId: string): Promise<Map<string, string>> {
  return pickCovers(storeId, "collection_id");
}
